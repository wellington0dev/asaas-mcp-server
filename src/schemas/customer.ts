import { z } from 'zod';

export const PersonTypeSchema = z.enum(['FISICA', 'JURIDICA']);

export const CustomerCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ is required').max(18),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().max(20).optional(),
  mobilePhone: z.string().max(20).optional(),
  address: z.string().max(255).optional(),
  addressNumber: z.string().max(20).optional(),
  complement: z.string().max(255).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(10).optional(),
  externalReference: z.string().max(100).optional(),
  notificationDisabled: z.boolean().optional(),
  additionalEmails: z.string().max(500).optional(),
  municipalInscription: z.string().max(50).optional(),
  stateInscription: z.string().max(50).optional(),
  observations: z.string().max(1000).optional(),
  groupName: z.string().max(100).optional(),
  groupNames: z.array(z.string().max(100)).max(20).optional(),
  company: z.string().max(255).optional(),
  foreignCustomer: z.boolean().optional(),
});

export const CustomerUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  mobilePhone: z.string().max(20).optional(),
  address: z.string().max(255).optional(),
  addressNumber: z.string().max(20).optional(),
  complement: z.string().max(255).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(10).optional(),
  externalReference: z.string().max(100).optional(),
  notificationDisabled: z.boolean().optional(),
  additionalEmails: z.string().max(500).optional(),
  municipalInscription: z.string().max(50).optional(),
  stateInscription: z.string().max(50).optional(),
  observations: z.string().max(1000).optional(),
  groupName: z.string().max(100).optional(),
  groupNames: z.array(z.string().max(100)).max(20).optional(),
  company: z.string().max(255).optional(),
});

export const CustomerListSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  cpfCnpj: z.string().optional(),
  externalReference: z.string().optional(),
  deleted: z.boolean().optional(),
});

export type CustomerCreateInput = z.infer<typeof CustomerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof CustomerUpdateSchema>;
export type CustomerListInput = z.infer<typeof CustomerListSchema>;
