
'use strict';
// let mem0
// let mem1
// let mem2
// let mem3
// let mem4
// let mem5
// let mem6
// let mem7
// let mem8
// let mem9



export const RandonMessage = () => {
  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  let p1 = [
    "Oi !",
    "Olá !",
    "Como vai?",
    "Tudo bom?",
    "Com licença.",
    "Tudo bem?",

  ]

  let p2 = [
    "Instagram e TikTok",
    "TikTok e Instagram",
  ]
  let p3 = [
    "Acesse o nosso site",
    "Entre em nosso site",
    "Acesse o site",
    "Acesse o link do site",
    "Acesse o link do nosso site",
  ]
  let p4 = [
    "Natal",
    "Maceió",
    "João Pessoa",
    "Fortaleza",
    "Foz do Iguaçu",
    "Florianópolis",
    "Porto Seguro"
  ]
  let p5 = [
    "Bruno",
    "Pedro",
    "João",
    "Paulo",
    "Marcos",
    "Fabio",
    "Leandro"
  ]

  let memm = `${p1[getRandomInt(6)]}
Meu nome é ${p5[getRandomInt(7)]} sou agente de viagens da Best Milhas.
Estou passando por aqui para te informar de nossos Serviços.

*Já pensou em viajar de avião para ${p4[getRandomInt(6)]} por apenas 320,00 reais?*

✅  ${p3[getRandomInt(5)]} para ver essa e outras ofertas! 

https://bestmilhas.com/destiny

✈️ Best milhas, há 2 anos decolando com você! 

Siga-nos em nossas redes sociais 👇 ${p2[getRandomInt(2)]} *@busqueabest*

*Muito Obrigado e tenha um ótimo dia*
  `



  return memm
}

