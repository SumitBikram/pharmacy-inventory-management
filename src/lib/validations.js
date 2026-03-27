import { z } from 'zod';

export const medicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required').max(200),
  generic_name: z.string().max(200).optional().or(z.literal('')),
  category_id: z.string().uuid().optional().or(z.literal('')),
  manufacturer: z.string().max(200).optional().or(z.literal('')),
  composition: z.string().max(500).optional().or(z.literal('')),
  hsn_code: z.string().max(20).optional().or(z.literal('')),
  unit: z.enum(['pcs', 'strip', 'bottle', 'box', 'tube', 'ml']),
  prescription_required: z.boolean(),
});

export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(200),
  contact_person: z.string().max(200).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  gst_no: z.string().max(20).optional().or(z.literal('')),
});

export const purchaseItemSchema = z.object({
  medicine_id: z.string().uuid('Select a medicine'),
  batch_no: z.string().min(1, 'Batch number is required'),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  purchase_price: z.number().positive('Purchase price is required'),
  selling_price: z.number().positive('Selling price is required'),
  mrp: z.number().positive().optional().nullable(),
});

export const billItemSchema = z.object({
  medicine_id: z.string().uuid('Select a medicine'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export function validateForm(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }
  const errors = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });
  return { success: false, data: null, errors };
}
