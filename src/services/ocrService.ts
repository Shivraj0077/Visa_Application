import { createWorker } from 'tesseract.js';
import { supabase } from '../lib/supabase';

export const ocrService = {
  async processDocument(file: File, documentId: string, expectedData: any) {
    try {
      const worker = await createWorker('eng');
      const { data } = await worker.recognize(file);
      await worker.terminate();

      const extractedText = data.text;
      const extractedFields = this.extractFields(extractedText);

      const { matchScore, discrepancies } = this.validateFields(extractedFields, expectedData);
      const tamperingDetected = this.detectTampering(extractedText, data);

      const validationStatus = tamperingDetected
        ? 'suspicious'
        : matchScore >= 80
        ? 'valid'
        : matchScore >= 60
        ? 'invalid'
        : 'suspicious';

      const { data: ocrResult, error } = await supabase
        .from('ocr_results')
        .insert([
          {
            document_id: documentId,
            extracted_text: extractedText,
            extracted_fields: extractedFields,
            validation_status: validationStatus,
            match_score: matchScore,
            discrepancies,
            tampering_detected: tamperingDetected,
            processed_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return ocrResult;
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('Failed to process document');
    }
  },

  extractFields(text: string) {
    const fields: any = {};

    const nameMatch = text.match(/(?:name|nombre|nom)[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/i);
    if (nameMatch) fields.name = nameMatch[1].trim();

    const dobMatch = text.match(/(?:birth|born|dob|date of birth)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
    if (dobMatch) fields.dateOfBirth = dobMatch[1];

    const passportMatch = text.match(/(?:passport|pasaporte|passeport)[:\s]*([A-Z0-9]{6,9})/i);
    if (passportMatch) fields.passportNumber = passportMatch[1];

    const idMatch = text.match(/(?:id|identification|identity)[:\s]*([A-Z0-9]{5,15})/i);
    if (idMatch) fields.idNumber = idMatch[1];

    const nationalityMatch = text.match(/(?:nationality|ciudadanía|nationalité)[:\s]+([A-Z][a-z]+)/i);
    if (nationalityMatch) fields.nationality = nationalityMatch[1];

    const countryMatch = text.match(/(?:country|país|pays)[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i);
    if (countryMatch) fields.country = countryMatch[1];

    const expiryMatch = text.match(/(?:expiry|expiration|válido hasta|expire)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
    if (expiryMatch) fields.expiryDate = expiryMatch[1];

    return fields;
  },

  validateFields(extractedFields: any, expectedData: any) {
    const discrepancies: any[] = [];
    let matchCount = 0;
    let totalFields = 0;

    if (expectedData.name) {
      totalFields++;
      const extractedName = extractedFields.name?.toLowerCase() || '';
      const expectedName = expectedData.name.toLowerCase();

      if (extractedName.includes(expectedName) || expectedName.includes(extractedName)) {
        matchCount++;
      } else if (extractedName) {
        discrepancies.push({
          field: 'name',
          expected: expectedData.name,
          extracted: extractedFields.name,
          reason: 'Name mismatch',
        });
      }
    }

    if (expectedData.dateOfBirth && extractedFields.dateOfBirth) {
      totalFields++;
      if (this.compareDates(extractedFields.dateOfBirth, expectedData.dateOfBirth)) {
        matchCount++;
      } else {
        discrepancies.push({
          field: 'dateOfBirth',
          expected: expectedData.dateOfBirth,
          extracted: extractedFields.dateOfBirth,
          reason: 'Date of birth mismatch',
        });
      }
    }

    if (expectedData.nationality && extractedFields.nationality) {
      totalFields++;
      if (
        extractedFields.nationality.toLowerCase().includes(expectedData.nationality.toLowerCase()) ||
        expectedData.nationality.toLowerCase().includes(extractedFields.nationality.toLowerCase())
      ) {
        matchCount++;
      } else {
        discrepancies.push({
          field: 'nationality',
          expected: expectedData.nationality,
          extracted: extractedFields.nationality,
          reason: 'Nationality mismatch',
        });
      }
    }

    const matchScore = totalFields > 0 ? Math.round((matchCount / totalFields) * 100) : 0;

    return { matchScore, discrepancies };
  },

  compareDates(date1: string, date2: string): boolean {
    const normalize = (d: string) => d.replace(/[\/\-\.]/g, '');
    return normalize(date1) === normalize(date2);
  },

  detectTampering(text: string, ocrData: any): boolean {
    if (ocrData.confidence < 60) {
      return true;
    }

    const suspiciousPatterns = [
      /X{3,}/,
      /\*{3,}/,
      /#{3,}/,
      /\[REDACTED\]/i,
      /\[REMOVED\]/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    const words = text.split(/\s+/);
    const veryShortWords = words.filter(w => w.length === 1 || w.length === 2).length;
    if (veryShortWords > words.length * 0.4) {
      return true;
    }

    return false;
  },

  async getOCRResultByDocument(documentId: string) {
    const { data, error } = await supabase
      .from('ocr_results')
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async uploadDocument(applicationId: string, file: File, documentType: string) {
    const fileName = `${applicationId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert([
        {
          application_id: applicationId,
          document_type: documentType,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
        },
      ])
      .select()
      .single();

    if (docError) throw docError;

    return document;
  },

  async getDocumentsByApplication(applicationId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        ocr_results(*)
      `)
      .eq('application_id', applicationId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
