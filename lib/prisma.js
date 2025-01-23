const { PrismaClient } = require('@prisma/client');

// Create a new PrismaClient instance
const prisma = new PrismaClient();

// Export the prisma client for use in other parts of the application
module.exports = { prisma };
