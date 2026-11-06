-- Banco de Dados: saudeparatodos
CREATE DATABASE IF NOT EXISTS saudeparatodos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE saudeparatodos;

-- Tabela de Usuários / Pacientes (LGPD Compliant)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cpf_hash VARCHAR(64) NOT NULL UNIQUE,       -- Hash SHA-256 para busca indexada sem expor o CPF
    cpf_encrypted TEXT NOT NULL,                 -- CPF criptografado com AES-256
    cpf_masked VARCHAR(14) NOT NULL,             -- Exibição segura (ex: ***.456.789-**)
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,         -- Senha com hash criptográfico seguro (PBKDF2/Salt)
    phone VARCHAR(20) NOT NULL,
    birth_date VARCHAR(10) NOT NULL,
    sus_card VARCHAR(20) NOT NULL,
    dyslexia_mode BOOLEAN DEFAULT FALSE,
    colorblind_mode VARCHAR(30) DEFAULT 'default',
    font_scale VARCHAR(10) DEFAULT 'normal',
    lgpd_consent BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Unidades Básicas de Saúde (UBS)
CREATE TABLE IF NOT EXISTS ubs_units (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address VARCHAR(255) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'São Paulo',
    phone VARCHAR(20) NOT NULL,
    opening_hours VARCHAR(100) NOT NULL,
    specialties TEXT NOT NULL,
    accessible_facilities TEXT NOT NULL
);

-- Tabela de Profissionais de Saúde
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(36) PRIMARY KEY,
    ubs_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    crm VARCHAR(50) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    bio VARCHAR(255),
    FOREIGN KEY (ubs_id) REFERENCES ubs_units(id) ON DELETE CASCADE
);

-- Tabela de Agendamentos de Consultas
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    ubs_id VARCHAR(36) NOT NULL,
    doctor_id VARCHAR(36) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'agendada',       -- 'agendada', 'confirmada', 'realizada', 'cancelada'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ubs_id) REFERENCES ubs_units(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Tabela de Histórico de Atendimentos Médicos
CREATE TABLE IF NOT EXISTS medical_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    ubs_name VARCHAR(255) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10) NOT NULL,
    diagnosis TEXT NOT NULL,
    prescription TEXT,
    recommendations TEXT,
    status VARCHAR(20) DEFAULT 'realizada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed de UBSs
INSERT IGNORE INTO ubs_units (id, name, code, address, neighborhood, city, phone, opening_hours, specialties, accessible_facilities)
VALUES 
('ubs-01', 'UBS Central Dra. Zilda Arns', 'UBS-001', 'Av. da Saúde Pública, 450', 'Centro', 'São Paulo', '(11) 3322-1000', 'Segunda a Sexta: 07:00 às 19:00', 'Clínica Geral, Pediatria, Ginecologia e Obstetrícia, Odontologia, Enfermagem, Vacinação', 'Rampas de acesso, Piso tátil, Banheiro adaptado, Intérprete de Libras às terças'),
('ubs-02', 'UBS Vila Esperança', 'UBS-002', 'Rua das Flores, 120', 'Vila Esperança', 'São Paulo', '(11) 3344-2000', 'Segunda a Sexta: 07:00 às 18:00', 'Clínica Geral, Pediatria, Enfermagem, Coleta de Exames', 'Acesso nível térreo, Sanitário acessível, Balcão rebaixado'),
('ubs-03', 'UBS Parque das Nações', 'UBS-003', 'Praça da Cidadania, 88', 'Parque das Nações', 'São Paulo', '(11) 3355-3000', 'Segunda a Sexta: 07:00 às 19:00, Sábado: 08:00 às 13:00', 'Clínica Geral, Ginecologia, Odontologia, Psicologia, Fisioterapia', 'Elevador acessível, Corrimãos duplos, Vagas reservadas'),
('ubs-04', 'UBS Jardim Alvorada', 'UBS-004', 'Alameda dos Ipês, 310', 'Jardim Alvorada', 'São Paulo', '(11) 3366-4000', 'Segunda a Sexta: 07:00 às 17:00', 'Clínica Geral, Pediatria, Nutrição, Enfermagem', 'Acesso térreo, Sala de acolhimento humanizado');

-- Seed de Profissionais
INSERT IGNORE INTO doctors (id, ubs_id, name, crm, specialty, bio)
VALUES
('doc-01', 'ubs-01', 'Dra. Mariana Vasconcelos', 'CRM/SP 145.890', 'Clínica Geral', 'Especialista em Saúde da Família e Comunidade'),
('doc-02', 'ubs-01', 'Dr. Carlos Eduardo Lima', 'CRM/SP 132.411', 'Pediatria', 'Atendimento humanizado infantil e acompanhamento vacinal'),
('doc-03', 'ubs-01', 'Dra. Beatriz Santos Ribeiro', 'CRM/SP 158.902', 'Ginecologia e Obstetrícia', 'Cuidado integral da mulher e pré-natal'),
('doc-04', 'ubs-01', 'Dr. Roberto Mendes', 'CRO/SP 44.120', 'Odontologia', 'Prevenção e odontologia básica comunitária'),
('doc-05', 'ubs-02', 'Dr. Fernando Albuquerque', 'CRM/SP 119.340', 'Clínica Geral', 'Acompanhamento de hipertensão e diabetes'),
('doc-06', 'ubs-02', 'Dra. Juliana Prado', 'CRM/SP 167.892', 'Pediatria', 'Pediatria geral e puericultura'),
('doc-07', 'ubs-03', 'Dr. Marcelo Antunes', 'CRM/SP 173.201', 'Clínica Geral', 'Medicina preventiva e cuidado ao idoso'),
('doc-08', 'ubs-03', 'Dra. Patrícia Gomes', 'CRM/SP 149.034', 'Ginecologia e Obstetrícia', 'Saúde reprodutiva e exames preventivos');
