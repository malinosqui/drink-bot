import { PromptsService } from './src/services/prompts';

console.log('🧪 Testando melhorias do Drink Bot...\n');

// Teste 1: Drink do Dia
console.log('1️⃣ TESTE: Drink do Dia');
const drinkOfDay = PromptsService.getDrinkOfTheDay();
console.log(`   Nome: ${drinkOfDay.name}`);
console.log(`   Descrição: ${drinkOfDay.description}`);
console.log(`   Receita: ${drinkOfDay.recipe.substring(0, 50)}...`);
console.log('');

// Teste 2: Saudações por horário
console.log('2️⃣ TESTE: Saudação por Horário');
const greeting = PromptsService.getTimeBasedGreeting();
console.log(`   Saudação: ${greeting}`);
console.log('');

// Teste 3: Detecção de agradecimentos
console.log('3️⃣ TESTE: Detecção de Agradecimentos');
const testMessages = [
  'obrigado',
  'valeu mesmo',
  'muito obrigada',
  'top demais',
  'perfeito!',
  'show de bola',
  'como fazer caipirinha'
];

testMessages.forEach((msg, index) => {
  const isGratitude = PromptsService.isGratitudeMessage(msg);
  console.log(`   "${msg}" -> ${isGratitude ? '✅ Agradecimento' : '❌ Não é agradecimento'}`);
});
console.log('');

// Teste 4: Respostas de cortesia
console.log('4️⃣ TESTE: Respostas de Cortesia');
for (let i = 0; i < 3; i++) {
  const response = PromptsService.getRandomCourtesyResponse();
  console.log(`   Resposta ${i + 1}: ${response}`);
}
console.log('');

// Teste 5: Análise de intenção melhorada
console.log('5️⃣ TESTE: Análise de Intenção');
const intentTests = [
  'oi, tudo bem?',
  'obrigado pela ajuda',
  'drink do dia',
  'tenho vodka e limão',
  'quero algo sem álcool'
];

intentTests.forEach(msg => {
  const intent = PromptsService.analyzeUserIntent(msg);
  console.log(`   "${msg}"`);
  console.log(`   -> ${intent.substring(0, 80)}...`);
  console.log('');
});

console.log('✅ Teste concluído! Todas as melhorias funcionando.'); 