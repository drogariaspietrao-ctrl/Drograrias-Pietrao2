# Drogarias Pietrão 💊

Site completo de drogaria com catálogo mobile-first, cesta de compras, cálculo de descontos, finalização de pedido integrada ao WhatsApp e **Painel Administrativo da Gerência** com controle de preços, estoque e inteligência de vendas.

---

## 🚀 Como Executar o Projeto

1. Abra o arquivo `index.html` em qualquer navegador web moderno.
2. Não é necessária nenhuma instalação, servidor ou dependência externa (`Vanilla HTML5, CSS3 e JavaScript`).

---

## 🔐 Acesso ao Painel Administrativo

Para acessar o painel do gerente:
- Clique no link **"🔐 Acesso Administrativo"** no rodapé da página inicial, ou acesse pelo endereço adicionando `#admin` no final da URL (ex: `index.html#admin`).

### Credenciais Padrão Iniciais:
- **E-mail:** `admin@pietrao.com`
- **Senha:** `admin123`

> 💡 *Você pode alterar o e-mail e a senha do administrador a qualquer momento diretamente na aba **"⚙️ Configurações da Loja"** dentro do próprio painel.*

---

## ✨ Funcionalidades do Painel Administrativo

1. **📦 Catálogo & Preços:**
   - Cadastre novos produtos com Nome, Categoria, Preço Normal e Preço Promocional.
   - Cálculo automático do selo de desconto (`-X% OFF`).
   - Upload de foto do produto por URL da internet ou **arquivo direto do computador/celular**.
   - Defina produtos como **"Promoção do Dia"** para aparecerem no carrossel de ofertas.
   - Seleção de categorias predefinidas com opção **"➕ Adicionar nova categoria..."** para criar novas categorias dinamicamente.
   - **Sigilo de Estoque:** As quantidades exatas em estoque são visíveis apenas para o Administrador. Para os clientes da vitrine, é exibido apenas o status de disponibilidade ou "Esgotado".

2. **⚠️ Estoque em Atenção:**
   - Painel interativo com cards de monitoramento para produtos com estoque zerado ou abaixo do limite de segurança.
   - Botões de **reposição rápida com 1 clique** (`+5 un.`, `+10 un.`, `+20 un.` ou valor customizado).

3. **📋 Pedidos & Vendas:**
   - Visualização de todos os pedidos realizados pelos clientes via checkout.
   - Controle de status do pedido: `🟡 Recebido`, `🔵 Em separação`, `🟣 Saiu para entrega`, `🟢 Concluído`, `🔴 Cancelado`.
   - Gráfico de produtos mais vendidos e métricas de faturamento.

4. **⚙️ Configurações da Loja:**
   - Configure o **número de WhatsApp oficial da farmácia** para receber os pedidos.
   - Altere a frase da barra de avisos do topo.
   - Ajuste o limite de alerta para estoque baixo.
   - Atualize o e-mail e a senha de login do administrador.
   - Baixe ou restaure backups em formato JSON.

---

## 🔥 Banco de Dados em Nuvem (Firebase Cloud Firestore)

O site utiliza o **Firebase Cloud Firestore** como banco de dados em tempo real na nuvem:

1. **Coleção `produtos`:** Armazena todos os medicamentos, categorias, fotos, preços, promoções e quantidades em estoque.
2. **Coleção `pedidos`:** Registra os pedidos realizados pelos clientes via checkout com atualização imediata de status.
3. **Documento `configuracoes/loja`:** Mantém o número oficial do WhatsApp, horário de atendimento, taxas de entrega e frete grátis sincronizados.
4. **Sincronização em Tempo Real (`onSnapshot`):** Qualquer alteração feita no painel do administrador (pelo celular ou computador) reflete **instantaneamente na vitrine de todos os clientes sem precisar recarregar a página**.

---

## 📱 Tecnologias Utilizadas

- **HTML5 Semântico:** Modais nativos `<dialog>`, acessibilidade e formulários estruturados.
- **CSS3 Moderno:** Design System com variáveis HSL/Hex, layout Grid & Flexbox, animações de carrinho e responsividade para celular e computador.
- **JavaScript (ES6+ Modules):** Integração com o SDK oficial do **Firebase v12** (App, Firestore e Analytics).
- **SheetJS (`xlsx.full.min.js`):** Exportação e importação em massa via planilhas Excel integradas à nuvem.


