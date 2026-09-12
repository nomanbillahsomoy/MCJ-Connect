-- Insert Dummy Batches
INSERT INTO batches (batch_number, admission_year) VALUES 
(1, 2008), (2, 2009), (10, 2017), (13, 2020), (14, 2021);

-- Insert Dummy Identity Registry (Master Student Data)
INSERT INTO identity_registry (batch_id, student_id, full_name, academic_status, claim_status) 
SELECT id, 'B170602001', 'Abdur Rahman', 'graduated', 'unclaimed' FROM batches WHERE batch_number = 10;

INSERT INTO identity_registry (batch_id, student_id, full_name, academic_status, claim_status) 
SELECT id, 'B170602002', 'Sadia Islam', 'graduated', 'unclaimed' FROM batches WHERE batch_number = 10;

INSERT INTO identity_registry (batch_id, student_id, full_name, academic_status, claim_status) 
SELECT id, 'B210602045', 'Noman Billah', 'current_student', 'unclaimed' FROM batches WHERE batch_number = 14;
