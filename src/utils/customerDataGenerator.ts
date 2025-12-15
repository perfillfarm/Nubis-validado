const FIRST_NAMES = [
  'Ana', 'Maria', 'Jose', 'Joao', 'Carlos', 'Paulo', 'Pedro', 'Lucas',
  'Marcos', 'Felipe', 'Rafael', 'Bruno', 'Fernanda', 'Juliana', 'Camila',
  'Patricia', 'Amanda', 'Larissa', 'Beatriz', 'Gabriela', 'Rodrigo', 'Diego',
  'Thiago', 'Leonardo', 'Gustavo', 'Eduardo', 'Mariana', 'Carolina', 'Vanessa',
  'Renata', 'Sandra', 'Claudia', 'Adriana', 'Luciana', 'Simone', 'Cristina'
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
  'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
  'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha',
  'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado'
];

const DDD_LIST = [
  '11', '21', '31', '41', '51', '61', '71', '81', '91',
  '12', '13', '14', '15', '16', '17', '18', '19',
  '22', '24', '27', '28', '32', '33', '34', '35', '37', '38',
  '42', '43', '44', '45', '46', '47', '48', '49',
  '53', '54', '55', '62', '63', '64', '65', '66', '67', '68', '69',
  '73', '74', '75', '77', '79', '82', '83', '84', '85', '86', '87', '88', '89',
  '92', '93', '94', '95', '96', '97', '98', '99'
];

export function generateRandomName(): string {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

export function generateRandomEmail(name: string): string {
  const namePart = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z.]/g, '');
  const randomNum = Math.floor(Math.random() * 9999);
  const domain = Math.random() > 0.5 ? 'gmail.com' : 'hotmail.com';
  return `${namePart}${randomNum}@${domain}`;
}

export function generateRandomPhone(): string {
  const ddd = DDD_LIST[Math.floor(Math.random() * DDD_LIST.length)];
  const firstDigit = '9';
  const remainingDigits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${ddd}${firstDigit}${remainingDigits}`;
}

export function formatCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function generateUniqueExternalId(prefix: string = 'nubank'): string {
  const timestamp = Date.now();
  const random1 = Math.random().toString(36).substring(2, 11);
  const random2 = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${timestamp}_${random1}_${random2}`;
}

export function generateCustomerData(data: {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  cpf: string;
}) {
  const cleanCpf = formatCpf(data.cpf);

  const customerName = data.customerName &&
    data.customerName !== 'Cliente' &&
    data.customerName.trim() !== ''
    ? data.customerName
    : generateRandomName();

  const customerEmail = data.customerEmail &&
    !data.customerEmail.includes('example.com') &&
    !data.customerEmail.includes('@cliente.com') &&
    data.customerEmail.trim() !== ''
    ? data.customerEmail
    : generateRandomEmail(customerName);

  const customerPhone = data.customerPhone &&
    data.customerPhone !== '11999999999' &&
    data.customerPhone.trim() !== ''
    ? data.customerPhone.replace(/\D/g, '')
    : generateRandomPhone();

  return {
    cleanCpf,
    customerName,
    customerEmail,
    customerPhone,
  };
}
