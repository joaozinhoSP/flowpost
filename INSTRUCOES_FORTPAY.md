# Configuração do FortPay

## 1. Criar Conta no FortPay

Acesse https://app.fortpayplataforma.com.br e crie uma conta.

## 2. Criar os Checkouts no FortPay

No painel do FortPay, crie dois checkouts:

| Plano     | Valor | Tipo       |
|-----------|-------|------------|
| Pro       | R$ 29 | Assinatura |
| Business  | R$ 69 | Assinatura |

Para cada checkout, configure:
- **Webhook:** Informe a URL `https://SEU-SITE.com/api/payments/webhook`
- **Redirect (sucesso):** `https://SEU-SITE.com/payment/success`
- **Redirect (cancelamento):** `https://SEU-SITE.com/payment/cancel`

## 3. Copiar os Links

Após criar os checkouts, copie o link de cada um e cole no `.env` do FlowPost.

## 4. Configurar o FlowPost

Edite o arquivo `.env` na raiz do projeto:

```env
FORTPAY_CHECKOUT_URL_PRO="https://app.fortpayplataforma.com.br/checkout/SEU_LINK_PRO"
FORTPAY_CHECKOUT_URL_BUSINESS="https://app.fortpayplataforma.com.br/checkout/SEU_LINK_BUSINESS"
```

## 5. Iniciar

```bash
# Frontend + Backend juntos
npm run dev:all

# Ou separadamente:
npm run dev        # Vite (porta 3000)
npm run server     # Express (porta 3001)
```

## 6. Fluxo Completo

```
Usuário → /pricing → clica "Assinar"
  → Frontend chama POST /api/payments/create-checkout
  → Backend retorna URL do checkout do FortPay
  → Usuário é redirecionado para o FortPay
  → Usuário paga (Pix, cartão, boleto)
  → FortPay redireciona para /payment/success
  → FortPay envia webhook para /api/payments/webhook
  → Backend salva assinatura do usuário
```
