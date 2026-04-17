const { v4: uuidv4 } = require('uuid');
const prisma = require('./client');

const listVariables   = ()         => prisma.variable.findMany({ orderBy: { key: 'asc' } });
const createVariable  = (data)     => prisma.variable.create({ data: { id: uuidv4(), ...data } });
const updateVariable  = (id, data) => prisma.variable.update({ where: { id }, data });
const deleteVariable  = (id)       => prisma.variable.delete({ where: { id } });

module.exports = { listVariables, createVariable, updateVariable, deleteVariable };
