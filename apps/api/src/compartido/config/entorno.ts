import * as Joi from 'joi';

const secretoFuerte = Joi.string().min(32);

export const esquemaEntorno = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(8080),

  DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).required(),
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).required(),

  // Formato "kid:secreto,kid:secreto"; la primera clave firma y todas verifican.
  JWT_KEYS: Joi.string().pattern(/^[A-Za-z0-9_-]+:.{32,}$/, 'kid:secreto (32+ caracteres)'),
  JWT_SECRET: secretoFuerte,
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL_DIAS: Joi.number().integer().min(1).max(90).default(7),

  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  SWAGGER_ENABLED: Joi.boolean().when('NODE_ENV', {
    is: 'production',
    then: Joi.boolean().default(false),
    otherwise: Joi.boolean().default(true),
  }),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(120),
  THROTTLE_AUTH_LIMIT: Joi.number().integer().min(1).default(10),

  PAYMENT_PROVIDER: Joi.string().valid('mock', 'stripe').default('mock'),
  PAYMENT_CURRENCY: Joi.string().length(3).lowercase().default('usd'),
  STRIPE_SECRET_KEY: Joi.string().when('PAYMENT_PROVIDER', {
    is: 'stripe',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  STRIPE_WEBHOOK_SECRET: Joi.string().when('PAYMENT_PROVIDER', {
    is: 'stripe',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  PAGOS_TIMEOUT_MS: Joi.number().integer().min(500).default(5000),
  RESERVA_MINUTOS: Joi.number().integer().min(1).default(15),
  CONCILIACION_MINUTOS: Joi.number().integer().min(1).default(10),
  TRABAJOS_PROGRAMADOS: Joi.boolean().default(true),

  MEDIA_DRIVER: Joi.string().valid('local', 'supabase').default('local'),
  UPLOAD_DIR: Joi.string().default('../../.data/uploads'),
  SUPABASE_URL: Joi.string().uri().when('MEDIA_DRIVER', {
    is: 'supabase',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().when('MEDIA_DRIVER', {
    is: 'supabase',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  SUPABASE_STORAGE_BUCKET: Joi.string().default('product-images'),
  MEDIA_URL_TTL_SEGUNDOS: Joi.number().integer().min(60).default(3600),

  SMTP_HOST: Joi.string().optional().allow(''),
  SMTP_PORT: Joi.number().port().default(1025),
  SMTP_USER: Joi.string().optional().allow(''),
  SMTP_PASSWORD: Joi.string().optional().allow(''),
  SMTP_FROM: Joi.string().default('MinimalShop <no-reply@minimalshop.local>'),

  TLS_ENABLED: Joi.boolean().optional(),
  TLS_KEY_PATH: Joi.string().optional(),
  TLS_CERT_PATH: Joi.string().optional(),
})
  .or('JWT_KEYS', 'JWT_SECRET')
  .unknown(true);

export function validarEntorno(config: Record<string, unknown>) {
  const { error, value } = esquemaEntorno.validate(config, { abortEarly: false });
  if (error) {
    const detalle = error.details.map((d) => `- ${d.message}`).join('\n');
    throw new Error(`Configuración de entorno inválida:\n${detalle}`);
  }
  return value as Record<string, unknown>;
}
