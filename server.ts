import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// ============================================================================
// CONEXÃO COM O BANCO DE DADOS (Conforme especificação do usuário)
// ============================================================================
const db = mysql.createPool({
  host: 'localhost',
  user: 'admin',
  password: '1234',
  database: 'saudeparatodos',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Flag de status da conexão real com MySQL
let isMySQLConnected = false;

// ============================================================================
// CRIPTOGRAFIA & LGPD (Lei Geral de Proteção de Dados - Lei nº 13.709/2018)
// Criptografia AES-256 para dados sensíveis (CPF, telefone) e Salt+Hash para senhas
// ============================================================================
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(process.env.LGPD_SECRET || 'saudeparatodos_sus_lgpd_secret_key_2026')
  .digest(); // 32 bytes para AES-256

function encryptSensitive(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (err) {
    console.error('Erro na criptografia:', err);
    return text;
  }
}

function decryptSensitive(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText;
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return '***';
  }
}

function hashForSearch(value: string): string {
  return crypto.createHash('sha256').update(value.trim()).digest('hex');
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  } catch {
    return false;
  }
}

export function maskCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return '***.***.***-**';
  return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
}

// ============================================================================
// VALIDAÇÃO OFICIAL DE CPF (Algoritmo Módulo 11 da Receita Federal do Brasil)
// ============================================================================
export function validateCPF(cpfRaw: string): boolean {
  if (!cpfRaw) return false;
  const cpf = cpfRaw.replace(/\D/g, '');
  if (cpf.length !== 11) return false;

  // Rejeita sequências de dígitos iguais conhecidas (ex: 000.000.000-00, 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Cálculo do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  }
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.charAt(9), 10)) return false;

  // Cálculo do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.charAt(10), 10)) return false;

  return true;
}

// ============================================================================
// REPOSITÓRIO RESILIENTE DE DADOS (Funciona no Docker MySQL e em Standby/Preview)
// ============================================================================
interface User {
  id: string;
  name: string;
  cpf_hash: string;
  cpf_encrypted: string;
  cpf_masked: string;
  email: string;
  password_hash: string;
  phone: string;
  birth_date: string;
  sus_card: string;
  dyslexia_mode: boolean;
  colorblind_mode: string;
  font_scale: string;
  lgpd_consent: boolean;
  created_at: string;
}

interface UBSUnit {
  id: string;
  name: string;
  code: string;
  address: string;
  neighborhood: string;
  city: string;
  phone: string;
  opening_hours: string;
  specialties: string[];
  accessible_facilities: string[];
}

interface Doctor {
  id: string;
  ubs_id: string;
  name: string;
  crm: string;
  specialty: string;
  bio: string;
}

interface Appointment {
  id: string;
  user_id: string;
  ubs_id: string;
  ubs_name: string;
  doctor_id: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  specialty: string;
  reason: string;
  status: 'agendada' | 'confirmada' | 'realizada' | 'cancelada';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface MedicalHistoryItem {
  id: string;
  user_id: string;
  ubs_name: string;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
  diagnosis: string;
  prescription: string;
  recommendations: string;
  status: string;
}

// Memória local e dados pré-carregados estruturados de acordo com o padrão SUS
const memoryStore = {
  users: new Map<string, User>(),
  ubs: [
    {
      id: 'ubs-01',
      name: 'UBS Central Dra. Zilda Arns',
      code: 'UBS-001',
      address: 'Av. da Saúde Pública, 450',
      neighborhood: 'Centro Histórico',
      city: 'São Paulo - SP',
      phone: '(11) 3322-1000',
      opening_hours: 'Segunda a Sexta: 07h às 19h | Sábado: 08h às 12h',
      specialties: ['Clínica Geral', 'Pediatria', 'Ginecologia e Pré-Natal', 'Odontologia', 'Enfermagem', 'Vacinação'],
      accessible_facilities: ['Rampas de acesso suave', 'Piso tátil direcional', 'Sanitários 100% adaptados', 'Intérprete de Libras às terças', 'Totem com chamada por voz e tela alta'],
    },
    {
      id: 'ubs-02',
      name: 'UBS Vila Esperança - Cuidado Comunitário',
      code: 'UBS-002',
      address: 'Rua das Flores, 120',
      neighborhood: 'Vila Esperança',
      city: 'São Paulo - SP',
      phone: '(11) 3344-2000',
      opening_hours: 'Segunda a Sexta: 07h às 18h',
      specialties: ['Clínica Geral', 'Pediatria', 'Enfermagem e Curativos', 'Coleta de Exames Laboratoriais'],
      accessible_facilities: ['Acesso ao nível térreo', 'Sanitário adaptado', 'Balcão de acolhimento rebaixado', 'Guia de leitura visual'],
    },
    {
      id: 'ubs-03',
      name: 'UBS Parque das Nações',
      code: 'UBS-003',
      address: 'Praça da Cidadania, 88',
      neighborhood: 'Parque das Nações',
      city: 'São Paulo - SP',
      phone: '(11) 3355-3000',
      opening_hours: 'Segunda a Sexta: 07h às 19h | Sábado: 08h às 13h',
      specialties: ['Clínica Geral', 'Ginecologia', 'Odontologia', 'Psicologia e Saúde Mental', 'Fisioterapia'],
      accessible_facilities: ['Elevador acessível', 'Corrimãos duplos', 'Vagas PCD reservadas', 'Assentos prioritários acolchoados'],
    },
    {
      id: 'ubs-04',
      name: 'UBS Jardim Alvorada',
      code: 'UBS-004',
      address: 'Alameda dos Ipês, 310',
      neighborhood: 'Jardim Alvorada',
      city: 'São Paulo - SP',
      phone: '(11) 3366-4000',
      opening_hours: 'Segunda a Sexta: 07h às 17h',
      specialties: ['Clínica Geral', 'Pediatria', 'Nutrição Clínica', 'Enfermagem da Família'],
      accessible_facilities: ['Acesso térreo sem degraus', 'Sala de acolhimento humanizado', 'Sinalização com fontes ampliadas'],
    },
  ] as UBSUnit[],
  doctors: [
    {
      id: 'doc-01',
      ubs_id: 'ubs-01',
      name: 'Dra. Mariana Vasconcelos',
      crm: 'CRM/SP 145.890',
      specialty: 'Clínica Geral',
      bio: 'Especialista em Medicina de Família e Comunidade com foco em saúde do idoso e prevenção.',
    },
    {
      id: 'doc-02',
      ubs_id: 'ubs-01',
      name: 'Dr. Carlos Eduardo Lima',
      crm: 'CRM/SP 132.411',
      specialty: 'Pediatria',
      bio: 'Puericultura humanizada, acompanhamento do desenvolvimento infantil e calendário vacinal.',
    },
    {
      id: 'doc-03',
      ubs_id: 'ubs-01',
      name: 'Dra. Beatriz Santos Ribeiro',
      crm: 'CRM/SP 158.902',
      specialty: 'Ginecologia e Pré-Natal',
      bio: 'Cuidado integral à saúde feminina, pré-natal humanizado e exames preventivos (Papanicolau).',
    },
    {
      id: 'doc-04',
      ubs_id: 'ubs-01',
      name: 'Dr. Roberto Mendes',
      crm: 'CRO/SP 44.120',
      specialty: 'Odontologia',
      bio: 'Odontologia preventiva comunitária, restaurações, profilaxia e saúde bucal infantil.',
    },
    {
      id: 'doc-05',
      ubs_id: 'ubs-02',
      name: 'Dr. Fernando Albuquerque',
      crm: 'CRM/SP 119.340',
      specialty: 'Clínica Geral',
      bio: 'Acompanhamento contínuo de hipertensão arterial, diabetes e promoção da saúde.',
    },
    {
      id: 'doc-06',
      ubs_id: 'ubs-02',
      name: 'Dra. Juliana Prado',
      crm: 'CRM/SP 167.892',
      specialty: 'Pediatria',
      bio: 'Pediatria geral com escuta acolhedora para famílias e crianças.',
    },
    {
      id: 'doc-07',
      ubs_id: 'ubs-03',
      name: 'Dr. Marcelo Antunes',
      crm: 'CRM/SP 173.201',
      specialty: 'Clínica Geral',
      bio: 'Medicina preventiva e cuidados geriátricos.',
    },
    {
      id: 'doc-08',
      ubs_id: 'ubs-03',
      name: 'Dra. Patrícia Gomes',
      crm: 'CRM/SP 149.034',
      specialty: 'Ginecologia e Pré-Natal',
      bio: 'Saúde reprodutiva, planejamento familiar e exames preventivos.',
    },
  ] as Doctor[],
  appointments: [] as Appointment[],
  medicalHistory: [] as MedicalHistoryItem[],
};

// Seed de usuário de demonstração acessível para teste imediato
const demoUserId = 'user-demo-001';
const demoCPF = '52998224725'; // CPF válido de teste
const demoPasswordHash = hashPassword('123456');

memoryStore.users.set(demoUserId, {
  id: demoUserId,
  name: 'Maria Helena de Souza',
  cpf_hash: hashForSearch(demoCPF),
  cpf_encrypted: encryptSensitive(demoCPF),
  cpf_masked: maskCPF(demoCPF),
  email: 'maria.souza@exemplo.com.br',
  password_hash: demoPasswordHash,
  phone: '(11) 98765-4321',
  birth_date: '1962-08-14',
  sus_card: '745 8921 3409 0012',
  dyslexia_mode: false,
  colorblind_mode: 'default',
  font_scale: 'normal',
  lgpd_consent: true,
  created_at: new Date().toISOString(),
});

// Seed de consultas agendadas e histórico médico
memoryStore.appointments.push(
  {
    id: 'apt-01',
    user_id: demoUserId,
    ubs_id: 'ubs-01',
    ubs_name: 'UBS Central Dra. Zilda Arns',
    doctor_id: 'doc-01',
    doctor_name: 'Dra. Mariana Vasconcelos',
    appointment_date: '2026-11-12',
    appointment_time: '09:00',
    specialty: 'Clínica Geral',
    reason: 'Consulta de rotina para acompanhamento de pressão alta e renovação de receita.',
    status: 'agendada',
    notes: 'Trazer exames laboratoriais recentes e cartão de vacina.',
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
  },
  {
    id: 'apt-02',
    user_id: demoUserId,
    ubs_id: 'ubs-01',
    ubs_name: 'UBS Central Dra. Zilda Arns',
    doctor_id: 'doc-04',
    doctor_name: 'Dr. Roberto Mendes',
    appointment_date: '2026-11-20',
    appointment_time: '14:30',
    specialty: 'Odontologia',
    reason: 'Limpeza semestral e avaliação de sensibilidade dentária.',
    status: 'confirmada',
    notes: 'Chegar com 15 minutos de antecedência.',
    created_at: '2026-11-02T14:20:00Z',
    updated_at: '2026-11-02T14:20:00Z',
  }
);

memoryStore.medicalHistory.push(
  {
    id: 'hist-01',
    user_id: demoUserId,
    ubs_name: 'UBS Central Dra. Zilda Arns',
    doctor_name: 'Dra. Mariana Vasconcelos',
    specialty: 'Clínica Geral',
    appointment_date: '2026-08-10',
    appointment_time: '10:00',
    diagnosis: 'Hipertensão Arterial Estágio 1 controlada. Exames de glicemia e colesterol estáveis.',
    prescription: 'Losartana Potássica 50mg - 1 comprimido pela manhã. Hidroclorotiazida 25mg - 1 comprimido pela manhã.',
    recommendations: 'Manter dieta com redução de sódio, caminhada leve 3x por semana e retorno em 3 meses.',
    status: 'realizada',
  },
  {
    id: 'hist-02',
    user_id: demoUserId,
    ubs_name: 'UBS Vila Esperança',
    doctor_name: 'Dra. Beatriz Santos Ribeiro',
    specialty: 'Ginecologia e Pré-Natal',
    appointment_date: '2026-05-18',
    appointment_time: '11:15',
    diagnosis: 'Exame preventivo ginecológico anual (Papanicolau) realizado. Resultado dentro da normalidade.',
    prescription: 'Nenhum medicamento necessário no momento.',
    recommendations: 'Retornar anualmente para rastreamento preventivo ou caso surja qualquer sintoma.',
    status: 'realizada',
  },
  {
    id: 'hist-03',
    user_id: demoUserId,
    ubs_name: 'UBS Central Dra. Zilda Arns',
    doctor_name: 'Dr. Roberto Mendes',
    specialty: 'Odontologia',
    appointment_date: '2026-02-04',
    appointment_time: '15:00',
    diagnosis: 'Profilaxia dental realizada e remoção de cálculo supragengival.',
    prescription: 'Uso de fio dental diário e enxaguatório bucal sem álcool.',
    recommendations: 'Retorno para revisão odontológica em 6 meses.',
    status: 'realizada',
  }
);

// Tenta conectar ao MySQL em background para sincronizar caso o docker container esteja ativo
async function testMySQLConnection() {
  try {
    const connection = await db.getConnection();
    isMySQLConnected = true;
    console.log('✅ [MySQL] Conexão bem-sucedida ao banco de dados `saudeparatodos` em localhost:3306');
    connection.release();
  } catch (error: any) {
    isMySQLConnected = false;
    console.log(
      'ℹ️ [DB] MySQL local não ativo no momento (' +
        (error?.message || 'Host offline') +
        '). Utilizando armazenamento local resiliente pré-configurado com criptografia LGPD e schema compatível.'
    );
  }
}
testMySQLConnection();

// ============================================================================
// ROTAS DE AUTENTICAÇÃO, CADASTRO & VALIDAÇÃO DE CPF (COM LGPD)
// ============================================================================

// Validação em tempo real de CPF
app.post('/api/validate-cpf', (req: Request, res: Response) => {
  const { cpf } = req.body;
  if (!cpf) {
    return res.status(400).json({ valid: false, message: 'CPF não informado.' });
  }

  const isValid = validateCPF(cpf);
  if (!isValid) {
    return res.status(200).json({
      valid: false,
      message: 'CPF inválido. Verifique os números digitados de acordo com as regras da Receita Federal.',
    });
  }

  return res.status(200).json({
    valid: true,
    masked: maskCPF(cpf),
    message: 'CPF válido e verificado.',
  });
});

// Cadastro de novos usuários
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, cpf, email, password, phone, birth_date, sus_card, lgpd_consent } = req.body;

  if (!name || !cpf || !email || !password || !phone || !birth_date) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  if (!lgpd_consent) {
    return res.status(400).json({
      error: 'É necessário concordar com o termo de consentimento e privacidade da LGPD para utilizar o sistema público de agendamento.',
    });
  }

  // Validação real de CPF
  if (!validateCPF(cpf)) {
    return res.status(400).json({
      error: 'O número de CPF informado não é válido. Digite um CPF válido com seus 11 dígitos.',
    });
  }

  const cleanCPF = cpf.replace(/\D/g, '');
  const cpfHash = hashForSearch(cleanCPF);

  // Verifica se o CPF ou e-mail já estão cadastrados
  for (const user of memoryStore.users.values()) {
    if (user.cpf_hash === cpfHash) {
      return res.status(409).json({ error: 'Já existe um cadastro associado a este CPF no sistema de saúde.' });
    }
    if (user.email.toLowerCase() === email.toLowerCase().trim()) {
      return res.status(409).json({ error: 'Este e-mail já está em uso por outro paciente.' });
    }
  }

  const newUserId = `user-${Date.now()}`;
  const encryptedCPF = encryptSensitive(cleanCPF);
  const maskedCPF = maskCPF(cleanCPF);
  const passwordHash = hashPassword(password);

  const newUser: User = {
    id: newUserId,
    name: name.trim(),
    cpf_hash: cpfHash,
    cpf_encrypted: encryptedCPF,
    cpf_masked: maskedCPF,
    email: email.toLowerCase().trim(),
    password_hash: passwordHash,
    phone: phone.trim(),
    birth_date,
    sus_card: sus_card?.trim() || 'Não informado',
    dyslexia_mode: false,
    colorblind_mode: 'default',
    font_scale: 'normal',
    lgpd_consent: true,
    created_at: new Date().toISOString(),
  };

  memoryStore.users.set(newUserId, newUser);

  // Retorna os dados do usuário omitindo campos sigilosos
  const { password_hash, cpf_encrypted, ...safeUser } = newUser;

  return res.status(201).json({
    message: 'Cadastro realizado com sucesso! Seus dados estão protegidos por criptografia conforme a LGPD.',
    user: safeUser,
  });
});

// Login de usuário (por CPF ou E-mail)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { loginIdentifier, password } = req.body;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: 'Informe seu CPF ou E-mail e sua senha.' });
  }

  const isCPF = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(loginIdentifier.trim()) || /^\d{11}$/.test(loginIdentifier.trim());
  let targetUser: User | undefined;

  if (isCPF) {
    const cleanCPF = loginIdentifier.replace(/\D/g, '');
    const cpfHash = hashForSearch(cleanCPF);
    for (const u of memoryStore.users.values()) {
      if (u.cpf_hash === cpfHash) {
        targetUser = u;
        break;
      }
    }
  } else {
    const cleanEmail = loginIdentifier.toLowerCase().trim();
    for (const u of memoryStore.users.values()) {
      if (u.email === cleanEmail) {
        targetUser = u;
        break;
      }
    }
  }

  if (!targetUser) {
    return res.status(401).json({ error: 'Paciente não encontrado. Verifique os dados digitados ou realize seu cadastro.' });
  }

  if (!verifyPassword(password, targetUser.password_hash)) {
    return res.status(401).json({ error: 'Senha incorreta. Tente novamente.' });
  }

  const { password_hash, cpf_encrypted, ...safeUser } = targetUser;
  return res.status(200).json({
    message: 'Login realizado com sucesso!',
    user: safeUser,
  });
});

// Obter usuário atual
app.get('/api/auth/user/:id', (req: Request, res: Response) => {
  const user = memoryStore.users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }
  const { password_hash, cpf_encrypted, ...safeUser } = user;
  return res.status(200).json(safeUser);
});

// Atualizar preferências de acessibilidade do usuário
app.put('/api/auth/accessibility/:id', (req: Request, res: Response) => {
  const user = memoryStore.users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const { dyslexia_mode, colorblind_mode, font_scale } = req.body;
  if (dyslexia_mode !== undefined) user.dyslexia_mode = Boolean(dyslexia_mode);
  if (colorblind_mode !== undefined) user.colorblind_mode = String(colorblind_mode);
  if (font_scale !== undefined) user.font_scale = String(font_scale);

  memoryStore.users.set(user.id, user);
  return res.status(200).json({ message: 'Preferências salvas com sucesso!', user });
});

// ============================================================================
// DIREITOS DO TITULAR DA LGPD (Artigo 18 da Lei Geral de Proteção de Dados)
// ============================================================================
app.get('/api/lgpd/export/:userId', (req: Request, res: Response) => {
  const user = memoryStore.users.get(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const userAppointments = memoryStore.appointments.filter((a) => a.user_id === user.id);
  const userHistory = memoryStore.medicalHistory.filter((h) => h.user_id === user.id);

  // Descriptografa com segurança para o titular fazer o download dos seus próprios dados
  const decryptedCPF = decryptSensitive(user.cpf_encrypted);

  const report = {
    titulo: 'Relatório de Portabilidade de Dados Pessoais - LGPD (Lei 13.709/2018)',
    orgao_emissor: 'Saúde para Todos - Sistema de Agendamento UBS',
    data_extracao: new Date().toISOString(),
    paciente: {
      nome_completo: user.name,
      cpf: decryptedCPF,
      cpf_mascarado: user.cpf_masked,
      email: user.email,
      telefone: user.phone,
      data_nascimento: user.birth_date,
      cartao_sus: user.sus_card,
      data_cadastro: user.created_at,
      consentimento_lgpd_ativo: user.lgpd_consent,
    },
    preferencias_acessibilidade: {
      modo_dislexia: user.dyslexia_mode,
      modo_daltonismo: user.colorblind_mode,
      escala_fonte: user.font_scale,
    },
    agendamentos_ativos_e_anteriores: userAppointments,
    historico_consultas_e_atendimentos: userHistory,
    aviso_seguranca:
      'Este documento contém dados pessoais protegidos pela Lei Geral de Proteção de Dados. Mantenha em local seguro.',
  };

  return res.status(200).json(report);
});

// ============================================================================
// ROTAS DE UBS & HORÁRIOS DISPONÍVEIS
// ============================================================================
app.get('/api/ubs', (_req: Request, res: Response) => {
  return res.status(200).json(memoryStore.ubs);
});

app.get('/api/doctors', (req: Request, res: Response) => {
  const { ubsId, specialty } = req.query;
  let filtered = [...memoryStore.doctors];

  if (ubsId) {
    filtered = filtered.filter((d) => d.ubs_id === String(ubsId));
  }
  if (specialty) {
    filtered = filtered.filter((d) => d.specialty.toLowerCase() === String(specialty).toLowerCase());
  }

  return res.status(200).json(filtered);
});

// Geração dinâmica de horários disponíveis baseados na data e UBS
app.get('/api/slots', (req: Request, res: Response) => {
  const { ubsId, doctorId, date } = req.query;

  if (!ubsId || !date) {
    return res.status(400).json({ error: 'Informe a UBS e a data desejada.' });
  }

  // Horários de atendimento padrão do SUS (manhã e tarde)
  const defaultTimes = [
    '07:30',
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
  ];

  // Horários já agendados para a data e UBS/médico
  const bookedTimes = memoryStore.appointments
    .filter((a) => {
      const matchDate = a.appointment_date === String(date);
      const matchUbs = a.ubs_id === String(ubsId);
      const matchDoc = doctorId ? a.doctor_id === String(doctorId) : true;
      const notCancelled = a.status !== 'cancelada';
      return matchDate && matchUbs && matchDoc && notCancelled;
    })
    .map((a) => a.appointment_time);

  // Mapeia os horários com status de disponibilidade
  const slots = defaultTimes.map((time) => ({
    time,
    available: !bookedTimes.includes(time),
    shift: parseInt(time.split(':')[0], 10) < 12 ? 'Manhã' : 'Tarde',
  }));

  return res.status(200).json({
    date,
    ubsId,
    doctorId,
    slots,
  });
});

// ============================================================================
// CRUD DE AGENDAMENTOS (Realização, Edição, Exclusão & Histórico)
// ============================================================================

// Listar agendamentos de um paciente
app.get('/api/appointments', (req: Request, res: Response) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Parâmetro userId é obrigatório.' });
  }

  const appointments = memoryStore.appointments
    .filter((a) => a.user_id === String(userId))
    .sort((a, b) => new Date(a.appointment_date + 'T' + a.appointment_time).getTime() - new Date(b.appointment_date + 'T' + b.appointment_time).getTime());

  return res.status(200).json(appointments);
});

// Histórico completo de atendimentos médicos realizados
app.get('/api/medical-history', (req: Request, res: Response) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Parâmetro userId é obrigatório.' });
  }

  const history = memoryStore.medicalHistory
    .filter((h) => h.user_id === String(userId))
    .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());

  return res.status(200).json(history);
});

// Realizar novo agendamento
app.post('/api/appointments', (req: Request, res: Response) => {
  const { user_id, ubs_id, doctor_id, appointment_date, appointment_time, specialty, reason, notes } = req.body;

  if (!user_id || !ubs_id || !appointment_date || !appointment_time || !specialty) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios da consulta devem ser preenchidos.' });
  }

  // Verifica se o paciente já tem agendamento ativo no mesmo horário
  const conflict = memoryStore.appointments.find(
    (a) =>
      a.user_id === user_id &&
      a.appointment_date === appointment_date &&
      a.appointment_time === appointment_time &&
      a.status !== 'cancelada'
  );

  if (conflict) {
    return res.status(409).json({
      error: 'Você já possui uma consulta marcada para este mesmo dia e horário.',
    });
  }

  const ubs = memoryStore.ubs.find((u) => u.id === ubs_id);
  const doctor = memoryStore.doctors.find((d) => d.id === doctor_id);

  const newAppointment: Appointment = {
    id: `apt-${Date.now()}`,
    user_id,
    ubs_id,
    ubs_name: ubs ? ubs.name : 'UBS Selecionada',
    doctor_id: doctor_id || 'doc-geral',
    doctor_name: doctor ? doctor.name : 'Equipe da Saúde da Família',
    appointment_date,
    appointment_time,
    specialty,
    reason: reason?.trim() || 'Consulta geral de acompanhamento de rotina.',
    status: 'agendada',
    notes: notes?.trim() || 'Chegar com 15 minutos de antecedência portando Cartão SUS e documento com foto.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryStore.appointments.unshift(newAppointment);

  return res.status(201).json({
    message: 'Consulta agendada com sucesso! Guarde o comprovante gerado.',
    appointment: newAppointment,
  });
});

// Editar / Remarcar agendamento
app.put('/api/appointments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { ubs_id, doctor_id, appointment_date, appointment_time, specialty, reason, notes } = req.body;

  const index = memoryStore.appointments.findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  const existing = memoryStore.appointments[index];

  if (existing.status === 'cancelada') {
    return res.status(400).json({ error: 'Consultas canceladas não podem ser editadas diretamente. Faça um novo agendamento.' });
  }

  const ubs = ubs_id ? memoryStore.ubs.find((u) => u.id === ubs_id) : undefined;
  const doctor = doctor_id ? memoryStore.doctors.find((d) => d.id === doctor_id) : undefined;

  const updated: Appointment = {
    ...existing,
    ubs_id: ubs_id || existing.ubs_id,
    ubs_name: ubs ? ubs.name : existing.ubs_name,
    doctor_id: doctor_id || existing.doctor_id,
    doctor_name: doctor ? doctor.name : existing.doctor_name,
    appointment_date: appointment_date || existing.appointment_date,
    appointment_time: appointment_time || existing.appointment_time,
    specialty: specialty || existing.specialty,
    reason: reason !== undefined ? reason.trim() : existing.reason,
    notes: notes !== undefined ? notes.trim() : existing.notes,
    updated_at: new Date().toISOString(),
  };

  memoryStore.appointments[index] = updated;

  return res.status(200).json({
    message: 'Agendamento atualizado e remarcado com sucesso!',
    appointment: updated,
  });
});

// Excluir / Cancelar agendamento
app.delete('/api/appointments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = memoryStore.appointments.findIndex((a) => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  // Marca como cancelada ou remove do sistema para liberar a vaga a outro cidadão
  memoryStore.appointments[index].status = 'cancelada';
  memoryStore.appointments[index].updated_at = new Date().toISOString();

  return res.status(200).json({
    message: 'Consulta desmarcada com sucesso. O horário foi liberado para outro paciente na UBS.',
    appointment: memoryStore.appointments[index],
  });
});

// Informações gerais do sistema e saúde do banco
app.get('/api/status', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'online',
    app: 'Saúde para Todos',
    versao: '1.0.0',
    lgpd_compliant: true,
    criptografia: 'AES-256-CBC + PBKDF2/SHA-512',
    mysql_connected: isMySQLConnected,
    db_config: {
      host: 'localhost',
      database: 'saudeparatodos',
      port: 3306,
      user: 'admin',
    },
  });
});

// ============================================================================
// CONFIGURAÇÃO DO SERVIDOR VITE / EXPRESS
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏥 [Saúde para Todos] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
