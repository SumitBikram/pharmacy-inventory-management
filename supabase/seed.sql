-- ============================================
-- SEED DATA
-- Run AFTER creating your first user via Supabase Auth
-- Replace the UUID and email with your actual admin user
-- ============================================

-- Step 1: Create a user in Supabase Dashboard > Authentication > Users
-- Step 2: Copy the user's UUID and paste below
-- Step 3: Run this SQL in the SQL Editor

-- INSERT INTO public.users (id, email, full_name, role)
-- VALUES (
--   'YOUR-USER-UUID-HERE',
--   'admin@pharmacy.com',
--   'Admin User',
--   'admin'
-- );

-- Sample categories
INSERT INTO public.categories (name, description) VALUES
  ('Tablets', 'Oral tablets and capsules'),
  ('Syrups', 'Liquid oral medications'),
  ('Injections', 'Injectable medications'),
  ('Topical', 'Creams, ointments, and gels'),
  ('Drops', 'Eye drops, ear drops, nasal drops'),
  ('Inhalers', 'Respiratory inhalers'),
  ('Supplements', 'Vitamins and dietary supplements'),
  ('Surgical', 'Surgical supplies and dressings');

-- Sample medicines
-- Uses subqueries to reference category IDs dynamically

-- Tablets
INSERT INTO public.medicines (name, generic_name, category_id, manufacturer, composition, hsn_code, unit, prescription_required) VALUES
  ('Dolo 650', 'Paracetamol', (SELECT id FROM public.categories WHERE name = 'Tablets'), 'Micro Labs', 'Paracetamol 650mg', '3004', 'strip', false),
  ('Azithral 500', 'Azithromycin', (SELECT id FROM public.categories WHERE name = 'Tablets'), 'Alembic Pharma', 'Azithromycin 500mg', '3004', 'strip', true),
  ('Pan 40', 'Pantoprazole', (SELECT id FROM public.categories WHERE name = 'Tablets'), 'Alkem Labs', 'Pantoprazole 40mg', '3004', 'strip', false),
  ('Crocin Advance', 'Paracetamol', (SELECT id FROM public.categories WHERE name = 'Tablets'), 'GSK', 'Paracetamol 500mg', '3004', 'strip', false),
  ('Amoxyclav 625', 'Amoxicillin + Clavulanate', (SELECT id FROM public.categories WHERE name = 'Tablets'), 'Cipla', 'Amoxicillin 500mg + Clavulanic Acid 125mg', '3004', 'strip', true),
  ('Combiflam', 'Ibuprofen + Paracetamol', (SELECT id FROM public.categories WHERE name = 'Tablets'), 'Sanofi', 'Ibuprofen 400mg + Paracetamol 325mg', '3004', 'strip', false),
  ('Metformin 500', 'Metformin', (SELECT id FROM public.categories WHERE name = 'Tablets'), 'USV', 'Metformin Hydrochloride 500mg', '3004', 'strip', true),
  ('Ecosprin 75', 'Aspirin', (SELECT id FROM public.categories WHERE name = 'Tablets'), 'USV', 'Aspirin 75mg', '3004', 'strip', false),
  ('Cetirizine 10mg', 'Cetirizine', (SELECT id FROM public.categories WHERE name = 'Tablets'), 'Cipla', 'Cetirizine Hydrochloride 10mg', '3004', 'strip', false),
  ('Amlodipine 5mg', 'Amlodipine', (SELECT id FROM public.categories WHERE name = 'Tablets'), 'Cipla', 'Amlodipine Besylate 5mg', '3004', 'strip', true);

-- Syrups
INSERT INTO public.medicines (name, generic_name, category_id, manufacturer, composition, hsn_code, unit, prescription_required) VALUES
  ('Benadryl Cough Syrup', 'Diphenhydramine', (SELECT id FROM public.categories WHERE name = 'Syrups'), 'Johnson & Johnson', 'Diphenhydramine 14.08mg/5ml', '3004', 'bottle', false),
  ('Grilinctus', 'Dextromethorphan + CPM', (SELECT id FROM public.categories WHERE name = 'Syrups'), 'Franco-Indian', 'Dextromethorphan 10mg + CPM 4mg per 5ml', '3004', 'bottle', false),
  ('Ondem Syrup', 'Ondansetron', (SELECT id FROM public.categories WHERE name = 'Syrups'), 'Alkem Labs', 'Ondansetron 2mg/5ml', '3004', 'bottle', true),
  ('Allegra Suspension', 'Fexofenadine', (SELECT id FROM public.categories WHERE name = 'Syrups'), 'Sanofi', 'Fexofenadine 30mg/5ml', '3004', 'bottle', false),
  ('Calpol Pediatric', 'Paracetamol', (SELECT id FROM public.categories WHERE name = 'Syrups'), 'GSK', 'Paracetamol 120mg/5ml', '3004', 'bottle', false);

-- Injections
INSERT INTO public.medicines (name, generic_name, category_id, manufacturer, composition, hsn_code, unit, prescription_required) VALUES
  ('Monocef 1g', 'Ceftriaxone', (SELECT id FROM public.categories WHERE name = 'Injections'), 'Aristo Pharma', 'Ceftriaxone Sodium 1g', '3004', 'vial', true),
  ('Pantocid IV', 'Pantoprazole', (SELECT id FROM public.categories WHERE name = 'Injections'), 'Sun Pharma', 'Pantoprazole 40mg', '3004', 'vial', true),
  ('Tramadol 50mg Inj', 'Tramadol', (SELECT id FROM public.categories WHERE name = 'Injections'), 'Neon Labs', 'Tramadol Hydrochloride 50mg/ml', '3004', 'ampoule', true),
  ('Insulin Mixtard 30', 'Insulin Human', (SELECT id FROM public.categories WHERE name = 'Injections'), 'Novo Nordisk', 'Soluble Insulin 30% + Isophane Insulin 70%', '3004', 'vial', true),
  ('Avil Injection', 'Pheniramine', (SELECT id FROM public.categories WHERE name = 'Injections'), 'Sanofi', 'Pheniramine Maleate 22.75mg/ml', '3004', 'ampoule', true);

-- Topical
INSERT INTO public.medicines (name, generic_name, category_id, manufacturer, composition, hsn_code, unit, prescription_required) VALUES
  ('Betadine Ointment', 'Povidone-Iodine', (SELECT id FROM public.categories WHERE name = 'Topical'), 'Win-Medicare', 'Povidone-Iodine 5% w/w', '3004', 'tube', false),
  ('Soframycin Cream', 'Framycetin', (SELECT id FROM public.categories WHERE name = 'Topical'), 'Sanofi', 'Framycetin Sulphate 1% w/w', '3004', 'tube', false),
  ('Volini Gel', 'Diclofenac', (SELECT id FROM public.categories WHERE name = 'Topical'), 'Sun Pharma', 'Diclofenac Diethylamine 1.16% w/w', '3004', 'tube', false),
  ('Candid Cream', 'Clotrimazole', (SELECT id FROM public.categories WHERE name = 'Topical'), 'Glenmark', 'Clotrimazole 1% w/w', '3004', 'tube', false),
  ('Moov Cream', 'Diclofenac + Linseed Oil', (SELECT id FROM public.categories WHERE name = 'Topical'), 'Reckitt', 'Diclofenac + Methyl Salicylate + Linseed Oil', '3004', 'tube', false);

-- Drops
INSERT INTO public.medicines (name, generic_name, category_id, manufacturer, composition, hsn_code, unit, prescription_required) VALUES
  ('Moxiflox Eye Drops', 'Moxifloxacin', (SELECT id FROM public.categories WHERE name = 'Drops'), 'Cipla', 'Moxifloxacin 0.5% w/v', '3004', 'bottle', true),
  ('Otrivin Nasal Drops', 'Xylometazoline', (SELECT id FROM public.categories WHERE name = 'Drops'), 'Novartis', 'Xylometazoline 0.1% w/v', '3004', 'bottle', false),
  ('Genteal Eye Drops', 'Hydroxypropyl Methylcellulose', (SELECT id FROM public.categories WHERE name = 'Drops'), 'Alcon', 'HPMC 0.3% w/v', '3004', 'bottle', false),
  ('Ciplox Eye Drops', 'Ciprofloxacin', (SELECT id FROM public.categories WHERE name = 'Drops'), 'Cipla', 'Ciprofloxacin 0.3% w/v', '3004', 'bottle', true),
  ('Nasivion Nasal Drops', 'Oxymetazoline', (SELECT id FROM public.categories WHERE name = 'Drops'), 'Merck', 'Oxymetazoline 0.025% w/v', '3004', 'bottle', false);

-- Inhalers
INSERT INTO public.medicines (name, generic_name, category_id, manufacturer, composition, hsn_code, unit, prescription_required) VALUES
  ('Asthalin Inhaler', 'Salbutamol', (SELECT id FROM public.categories WHERE name = 'Inhalers'), 'Cipla', 'Salbutamol 100mcg/dose', '3004', 'pcs', true),
  ('Foracort 200', 'Budesonide + Formoterol', (SELECT id FROM public.categories WHERE name = 'Inhalers'), 'Cipla', 'Budesonide 200mcg + Formoterol 6mcg', '3004', 'pcs', true),
  ('Budecort Inhaler', 'Budesonide', (SELECT id FROM public.categories WHERE name = 'Inhalers'), 'Sun Pharma', 'Budesonide 200mcg/dose', '3004', 'pcs', true),
  ('Seroflo 250', 'Salmeterol + Fluticasone', (SELECT id FROM public.categories WHERE name = 'Inhalers'), 'Cipla', 'Salmeterol 50mcg + Fluticasone 250mcg', '3004', 'pcs', true);

-- Supplements
INSERT INTO public.medicines (name, generic_name, category_id, manufacturer, composition, hsn_code, unit, prescription_required) VALUES
  ('Becosules Capsules', 'B-Complex + Vitamin C', (SELECT id FROM public.categories WHERE name = 'Supplements'), 'Pfizer', 'Vitamin B-Complex + Vitamin C', '2936', 'strip', false),
  ('Shelcal 500', 'Calcium + Vitamin D3', (SELECT id FROM public.categories WHERE name = 'Supplements'), 'Torrent Pharma', 'Calcium 500mg + Vitamin D3 250 IU', '2936', 'strip', false),
  ('Zincovit', 'Multivitamin + Zinc', (SELECT id FROM public.categories WHERE name = 'Supplements'), 'Apex Labs', 'Multivitamin + Multimineral + Zinc', '2936', 'strip', false),
  ('Limcee 500', 'Vitamin C', (SELECT id FROM public.categories WHERE name = 'Supplements'), 'Abbott', 'Ascorbic Acid 500mg', '2936', 'strip', false),
  ('Feronia XT', 'Iron + Folic Acid', (SELECT id FROM public.categories WHERE name = 'Supplements'), 'Emcure', 'Ferrous Ascorbate 100mg + Folic Acid 1.5mg', '2936', 'strip', false);

-- Surgical
INSERT INTO public.medicines (name, generic_name, category_id, manufacturer, composition, hsn_code, unit, prescription_required) VALUES
  ('Dettol Antiseptic Liquid', 'Chloroxylenol', (SELECT id FROM public.categories WHERE name = 'Surgical'), 'Reckitt', 'Chloroxylenol 4.8% w/v', '3808', 'bottle', false),
  ('Band-Aid Flexible Fabric', NULL, (SELECT id FROM public.categories WHERE name = 'Surgical'), 'Johnson & Johnson', 'Adhesive bandage strips', '3005', 'box', false),
  ('Betadine Solution', 'Povidone-Iodine', (SELECT id FROM public.categories WHERE name = 'Surgical'), 'Win-Medicare', 'Povidone-Iodine 10% w/v', '3004', 'bottle', false),
  ('Surgical Gauze Roll', NULL, (SELECT id FROM public.categories WHERE name = 'Surgical'), 'Softmed', 'Sterile absorbent cotton gauze', '3005', 'pcs', false),
  ('Disposable Syringes 5ml', NULL, (SELECT id FROM public.categories WHERE name = 'Surgical'), 'Hindustan Syringes', '5ml Luer lock syringe with needle', '9018', 'box', false);
