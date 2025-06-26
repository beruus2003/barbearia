# Deploy no Render - Instruções Completas

## Configuração das Variáveis de Ambiente

### 1. DATABASE_URL
**IMPORTANTE**: Cole exatamente esta URL sem aspas ou prefixos:

```
postgresql://neondb_owner:npg_IqP5Diho0bwA@ep-soft-fog-acg92hte-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**NÃO cole:**
- `psql 'postgresql://...'` ❌
- `'postgresql://...'` ❌
- Com espaços ou caracteres extras ❌

### 2. NODE_ENV
```
production
```

### 3. SESSION_SECRET
```
sua-chave-secreta-aqui-123456789
```

## Configurações do Render

### Build Command:
```
npm install && npm run build
```

### Start Command:
```
npm start
```

### Auto-Deploy:
- ✅ Habilitado (recomendado)

## Verificação

Após o deploy, você deve ver:
- `✓ Server build completed` no log de build
- `[express] serving on port XXXX` no log de start
- Sem erros de `ERR_INVALID_URL`

## Solução de Problemas

Se aparecer erro de URL inválida:
1. Verifique se a DATABASE_URL não tem aspas ou prefixos
2. Copie e cole novamente apenas a URL limpa
3. Reinicie o deploy