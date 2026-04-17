const prisma = require('./client');

async function listCredentials() {
  return prisma.credential.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, type: true, createdAt: true, updatedAt: true },
  });
}

async function getCredential(id) {
  return prisma.credential.findUnique({ where: { id } });
}

async function createCredential({ name, type, data }) {
  return prisma.credential.create({
    data: { name, type, data: typeof data === 'string' ? data : JSON.stringify(data) },
  });
}

async function updateCredential(id, { name, type, data }) {
  return prisma.credential.update({
    where: { id },
    data: { name, type, ...(data !== undefined ? { data: typeof data === 'string' ? data : JSON.stringify(data) } : {}) },
  });
}

async function deleteCredential(id) {
  return prisma.credential.delete({ where: { id } });
}

module.exports = { listCredentials, getCredential, createCredential, updateCredential, deleteCredential };
