/**
 * Serviço de Notícias
 * Mock data - facilmente substituível por API real
 */

import type { NewsArticle } from '@/types';

// ==================== MOCK DATA - 10 NOTÍCIAS ====================

export const mockArticles: NewsArticle[] = [
  {
    id: '1',
    slug: 'fed-sinaliza-cortes-juros-2024',
    title: 'Fed sinaliza cortes de juros para 2024 em meio à desaceleração inflacionária',
    titleEn: 'Fed signals rate cuts for 2024 amid inflation slowdown',
    excerpt: 'Banco Central americano mantém taxa entre 5,25% e 5,50%, mas projeções indicam três cortes no próximo ano. Mercados reagem com alta nas bolsas.',
    excerptEn: 'US Central Bank keeps rate between 5.25% and 5.50%, but projections indicate three cuts next year. Markets react with stock rally.',
    content: `
      <p>O Federal Reserve, banco central dos Estados Unidos, manteve nesta quarta-feira a taxa de juros referencial na faixa de 5,25% a 5,50%, conforme amplamente esperado pelo mercado. No entanto, o grande destaque foi a sinalização de que deve promover três cortes de juros ao longo de 2024.</p>
      
      <p>A decisão unânime do Comitê de Mercado Aberto Federal (FOMC) veio acompanhada de novas projeções econômicas que mostram uma trajetória mais suave para a inflação do que anteriormente previsto. O índice de preços ao consumidor pessoal (PCE), medida preferida do Fed, deve fechar 2024 em 2,4%, abaixo dos 2,6% projetados em setembro.</p>
      
      <p>"A inflação tem diminuído ao longo do ano passado, mas permanece elevada", afirmou o presidente do Fed, Jerome Powell, em coletiva de imprensa. "Acreditamos que nossa política monetária está em posição restritiva adequada", acrescentou, deixando claro que o ciclo de aperto chegou ao fim.</p>
      
      <h3>Reação dos Mercados</h3>
      
      <p>Os mercados financeiros reagiram de forma extremamente positiva à sinalização do Fed. O índice S&P 500 saltou 1,4%, atingindo nova máxima história, enquanto o Nasdaq Composite avançou 1,6%. O dólar, por sua vez, enfraqueceu frente a outras moedas principais.</p>
      
      <p>Os títulos do Tesouro americano também se valorizaram, com o rendimento do papel de 10 anos caindo para 3,95%, menor patamar desde julho. A curva de juros futuros passou a precificar com quase 80% de probabilidade um corte já em março de 2024.</p>
      
      <h3>Impacto no Brasil</h3>
      
      <p>Economistas consultados pelo Portal Econômico Mundial avaliam que a mudança de postura do Fed cria espaço para o Banco Central brasileiro acelerar seu próprio ciclo de cortes de juros. Atualmente, a Selic está em 11,75%, com expectativa de fechar 2024 em torno de 10%.</p>
      
      <p>"O alívio nas condições financeiras globais tende a beneficiar mercados emergentes, incluindo o Brasil", avalia Carlos Mendes, economista-chefe da PEM. "Podemos ver fluxos de capital de retorno aos países em desenvolvimento."</p>
      
      <h3>Cenário Econômico</h3>
      
      <p>As projeções atualizadas do Fed mostram crescimento do PIB americano de 2,6% em 2023, revisão de alta em relação aos 2,1% esperados anteriormente. Para 2024, a estimativa foi ajustada para 1,4%, refletindo uma desaceleração gradual da economia.</p>
      
      <p>O mercado de trabalho continua resiliente, com taxa de desemprego projetada em 3,8% para o fim de 2024. Esta combinação de crescimento moderado, inflação em queda e mercado de trabalho estável é considerada o "pouso suave" tão almejado pela autoridade monetária.</p>
      
      <p>O próximo encontro do FOMC está marcado para 30 e 31 de janeiro de 2024, quando os investidores buscarão mais pistas sobre o timing do primeiro corte de juros.</p>
    `,
    category: 'economia',
    author: 'Carlos Mendes',
    authorId: 'carlos-mendes',
    publishedAt: '2023-12-13T18:30:00Z',
    updatedAt: '2023-12-13T20:15:00Z',
    readingTime: 5,
    coverImage: '/images/news/fed-juros.webp',
    tags: ['Fed', 'Juros', 'Inflação', 'EUA', 'Mercados', 'BCB'],
    featured: true,
    breaking: false,
    views: 15420,
    likes: 892,
    shares: 456,
    comments: 127,
  },
  {
    id: '2',
    slug: 'china-taiwan-tensoes-2024',
    title: 'Tensões entre China e Taiwan atingem novo patamar com exercícios militares',
    titleEn: 'China-Taiwan tensions reach new level with military exercises',
    excerpt: 'Pequim realiza manobras navais sem precedentes no Estreito de Taiwan. Estados Unidos envia porta-aviões à região em demonstração de força.',
    excerptEn: 'Beijing conducts unprecedented naval maneuvers in Taiwan Strait. United States sends aircraft carrier to region in show of force.',
    content: `
      <p>A China lançou nesta terça-feira uma série de exercícios militares de grande escala ao redor de Taiwan, em what autoridades em Pequim descreveram como uma "resposta necessária" às recentes declarações do presidente taiwanês Lai Ching-te. As manobras envolvem forças navais, aéreas e de mísseis do Exército de Libertação do Povo (ELP).</p>
      
      <p>O comando militar da região leste do ELP anunciou que as operações, denominadas "União Afiada 2024", incluem simulações de bloqueio marítimo, ataques a alvos estratégicos e patrulhas com mísseis balísticos de médio alcance. Pelo menos 30 navios de guerra e 100 aeronaves participam dos exercícios.</p>
      
      <p>"Estas ações são uma advertência solene aos separatistas taiwaneses e às forças externas que interferem nos assuntos internos da China", afirmou o porta-voz do Ministério da Defesa chinês, coronel Wu Qian, em entrevista coletiva.</p>
      
      <h3>Resposta Americana</h3>
      
      <p>Em resposta rápida à escalada, o Comando Indo-Pacífico dos Estados Unidos ordenou o deslocamento do grupo de ataque do porta-aviões USS Ronald Reagan para águas próximas ao Estreito de Taiwan. O navio de guerra, acompanhado de três contratorpedeiros e um submarino nuclear, deve chegar à região nas próximas 48 horas.</p>
      
      <p>O secretário de Defesa americano, Lloyd Austin, condenou os exercícios chineses como "provocações desestabilizadoras". "Os Estados Unidos permanecem comprometidos com a defesa de Taiwan e com a manutenção da paz e estabilidade no Indo-Pacífico", declarou Austin em comunicado oficial.</p>
      
      <h3>Reação de Taiwan</h3>
      
      <p>O governo taiwanês elevou o nível de alerta militar e convocou reservistas para exercícios de prontidão. O presidente Lai, em discurso televisionado, pediu calma à população mas reafirmou a determinação de defender a ilha.</p>
      
      <p>"Taiwan não busca confronto, mas também não fugirá dele", afirmou Lai. "A democracia e a liberdade de nosso povo não estão à venda."</p>
      
      <p>A Força Aérea taiwanesa relatou múltiplas incursões de caças chineses em sua zona de identificação de defesa aérea (ADIZ), com mais de 50 aeronaves detectadas nas últimas 24 horas.</p>
      
      <h3>Implicações Globais</h3>
      
      <p>Analistas de segurança internacional alertam que a crise atual representa o momento de maior tensão desde a visita da então presidente da Câmara dos EUA, Nancy Pelosi, a Taiwan em 2022. A diferença, segundo especialistas, é a escala sem precedentes dos exercícios militares chineses.</p>
      
      <p>"Pequim está testando os limites da resposta internacional", avalia Julia Costa, especialista em relações sino-americanas. "Há uma clara intenção de normalizar operações militares cada vez mais próximas de Taiwan."</p>
      
      <p>O Japão, que administra ilhas próximas à Taiwan, também elevou seu estado de alerta. O primeiro-ministro Fumio Kishida convocou uma reunião de emergência do Conselho de Segurança Nacional.</p>
      
      <p>O Conselho de Segurança da ONU deve se reunir em sessão de emergência nesta quinta-feira a pedido dos Estados Unidos e de aliados europeus para discutir a crise.</p>
    `,
    category: 'geopolitica',
    author: 'Julia Costa',
    authorId: 'julia-costa',
    publishedAt: '2023-12-12T14:00:00Z',
    updatedAt: '2023-12-12T16:30:00Z',
    readingTime: 7,
    coverImage: '/images/news/china-taiwan.webp',
    tags: ['China', 'Taiwan', 'EUA', 'Defesa', 'Ásia', 'Conflito'],
    featured: true,
    breaking: true,
    views: 28340,
    likes: 1456,
    shares: 2341,
    comments: 892,
  },
  {
    id: '3',
    slug: 'ia-revoluciona-mercado-trabalho-2024',
    title: 'Inteligência Artificial revoluciona mercado de trabalho brasileiro',
    titleEn: 'Artificial Intelligence revolutionizes Brazilian job market',
    excerpt: 'Estudo da FGV mostra que 40% das empresas brasileiras já utilizam IA em algum processo. Setores de tecnologia e finanças lideram adoção.',
    excerptEn: 'FGV study shows 40% of Brazilian companies already use AI in some process. Technology and finance sectors lead adoption.',
    content: `
      <p>A inteligência artificial está transformando o mercado de trabalho brasileiro em velocidade sem precedentes. Um estudo inédito da Fundação Getulio Vargas (FGV) revela que 40% das empresas no país já implementaram soluções de IA em pelo menos um processo de negócio, número que deve chegar a 65% até o final de 2024.</p>
      
      <p>A pesquisa, que ouviu 1.500 empresas de diferentes portes e setores, mostra que os setores de tecnologia (78%), serviços financeiros (62%) e telecomunicações (55%) lideram a adoção. No entanto, a manufatura (28%) e o varejo (31%) ainda apresentam resistência à implementação.</p>
      
      <p>"Estamos vendo uma aceleração muito mais rápida do que prevíamos", afirma o coordenador do estudo, professor Ricardo Amorim. "A pandemia acelerou a transformação digital, e a IA está sendo o próximo passo natural dessa evolução."</p>
      
      <h3>Impacto nos Empregos</h3>
      
      <p>O estudo também mapeou o impacto da IA nos cargos existentes. Cerca de 23% das empresas relataram redução de headcount em funções administrativas e operacionais após a implementação de soluções de automação inteligente.</p>
      
      <p>Por outro lado, 67% das empresas criaram novos cargos relacionados à gestão e supervisão de sistemas de IA. As funções mais demandadas são engenheiros de machine learning, cientistas de dados e especialistas em ética de IA.</p>
      
      <p>"A história mostra que a tecnologia destrói empregos, mas cria outros", explica Ana Silva, economista do trabalho. "O desafio é garantir que os trabalhadores tenham acesso à requalificação necessária."</p>
      
      <h3>Governança e Regulação</h3>
      
      <p>A pesquisa da FGV identificou preocupações crescentes com questões éticas e regulatórias. Apenas 18% das empresas possuem comitês de governança de IA estabelecidos, e 45% ainda não têm políticas claras de uso da tecnologia.</p>
      
      <p>O Congresso Nacional debate atualmente um marco regulatório para inteligência artificial. O projeto de lei (PL 2.338/2023) estabelece princípios de transparência, não discriminação e responsabilidade para sistemas de IA.</p>
      
      <p>"A regulação é necessária, mas não pode sufocar a inovação", defende Pedro Santos, CEO de uma startup de IA em São Paulo. "Precisamos de um equilíbrio que proteja os cidadãos sem impedir o desenvolvimento tecnológico."</p>
      
      <h3>Investimentos em Capacitação</h3>
      
      <p>Frente às transformações, grandes empresas estão investindo em programas de requalificação de funcionários. O Itaú Unibanco anunciou investimento de R$ 200 milhões em treinamento de IA para seus 95 mil colaboradores ao longo dos próximos três anos.</p>
      
      <p>O governo federal também lançou o programa "Brasil IA", que prevê a capacitação de 1 milhão de profissionais em habilidades relacionadas à inteligência artificial até 2026. O programa oferece cursos gratuitos em parceria com universidades e empresas de tecnologia.</p>
      
      <p>"O Brasil tem potencial para ser um hub de IA na América Latina", afirma o ministro da Ciência e Tecnologia. "Temos talento, dados e um mercado consumidor enorme."</p>
    `,
    category: 'tecnologia',
    author: 'Pedro Santos',
    authorId: 'pedro-santos',
    publishedAt: '2023-12-11T10:00:00Z',
    updatedAt: '2023-12-11T14:20:00Z',
    readingTime: 6,
    coverImage: '/images/news/ia-trabalho.webp',
    tags: ['IA', 'Inteligência Artificial', 'Trabalho', 'Emprego', 'Tecnologia', 'FGV'],
    featured: true,
    breaking: false,
    views: 19850,
    likes: 1234,
    shares: 876,
    comments: 543,
  },
  {
    id: '4',
    slug: 'petroleo-precios-2024-projecoes',
    title: 'Petróleo oscila com tensões no Oriente Médio e projeções de oferta',
    titleEn: 'Oil fluctuates with Middle East tensions and supply projections',
    excerpt: 'Barril do Brent ultrapassa US$ 80 com ataques no Mar Vermelho. OPEP+ mantém cortes de produção no primeiro trimestre de 2024.',
    excerptEn: 'Brent barrel exceeds $80 with Red Sea attacks. OPEC+ maintains production cuts in first quarter of 2024.',
    content: `
      <p>Os preços do petróleo registraram forte volatilidade nesta semana, impulsionados por tensões geopolíticas no Oriente Médio e decisões da OPEP+ sobre produção. O barril do Brent chegou a ultrapassar os US$ 80, maior patamar desde novembro, enquanto o WTI negociou acima de US$ 75.</p>
      
      <p>A alta foi desencadeada por uma série de ataques de rebeldes houthis no Mar Vermelho, que atingiram dois navios mercantes na rota estratégica. A rota, que conecta o Oriente Médio à Europa através do Canal de Suez, é responsável por cerca de 12% do comércio global de petróleo.</p>
      
      <p>"O risco de interrupção no fornecimento pelo Mar Vermelho está criando um prêmio de risco nos preços", avalia Maria Oliveira, analista de commodities. "Empresas de navegação já estão desviando rotas, aumentando custos e prazos de entrega."</p>
      
      <h3>Decisão da OPEP+</h3>
      
      <p>Em meio às tensões, o grupo OPEP+ confirmou que manterá os cortes voluntários de produção de 2,2 milhões de barris por dia durante o primeiro trimestre de 2024. A Arábia Saudita, maior produtora do cartel, continuará reduzindo 1 milhão de barris diários de sua produção.</p>
      
      <p>A decisão, amplamente esperada pelo mercado, visa sustentar os preços diante da desaceleração da demanda global e do aumento da produção não-OPEP, especialmente dos Estados Unidos. A produção americana atingiu recorde de 13,2 milhões de barris por dia em dezembro.</p>
      
      <p>"A OPEP+ está jogando um jogo delicado", observa Carlos Mendes. "Precisa equilibrar receitas com a perda de market share para produtores americanos."</p>
      
      <h3>Demanda Global</h3>
      
      <p>A Agência Internacional de Energia (AIE) revisou em alta suas projeções de demanda para 2024, estimando crescimento de 1,1 milhão de barris por dia. A recuperação da economia chinesa e o aumento do transporte aéreo são os principais motores do crescimento.</p>
      
      <p>No entanto, preocupações com a desaceleração econômica na Europa e nos Estados Unidos continuam limitando as altas. A inflação persistente e os juros elevados em economias desenvolvidas podem frear o crescimento da demanda no segundo semestre.</p>
      
      <h3>Impacto no Brasil</h3>
      
      <p>Para o Brasil, maior produtor de petróleo da América Latina, a combinação de preços elevados e custos de produção controlados representa oportunidade de aumento de receitas. A Petrobras deve beneficiar-se da valorização do barril, embora a empresa tenha reduzido sua exposição à volatilidade através de hedge.</p>
      
      <p>O pré-sal brasileiro continua atraindo investimentos internacionais, com novos poços sendo licitados para exploração em 2024. A produção nacional deve atingir 3,5 milhões de barris por dia no próximo ano, consolidando o país como um dos principais players globais.</p>
    `,
    category: 'economia',
    author: 'Maria Oliveira',
    authorId: 'maria-oliveira',
    publishedAt: '2023-12-10T16:00:00Z',
    updatedAt: '2023-12-10T18:45:00Z',
    readingTime: 5,
    coverImage: '/images/news/petroleo.webp',
    tags: ['Petróleo', 'OPEP', 'Energia', 'Commodities', 'Oriente Médio', 'Preços'],
    featured: false,
    breaking: false,
    views: 12340,
    likes: 678,
    shares: 432,
    comments: 234,
  },
  {
    id: '5',
    slug: 'ue-aprova-regulacao-ia-historica',
    title: 'União Europeia aprova regulamentação histórica de Inteligência Artificial',
    titleEn: 'European Union approves historic Artificial Intelligence regulation',
    excerpt: 'Lei de IA da UE estabelece regras globais para sistemas de inteligência artificial. Multas podem chegar a 7% do faturamento.',
    excerptEn: 'EU AI Law establishes global rules for artificial intelligence systems. Fines can reach 7% of revenue.',
    content: `
      <p>Após meses de negociações intensas, o Parlamento Europeu e os Estados-membros da União Europeia alcançaram um acordo histórico sobre a regulamentação de inteligência artificial. O AI Act, primeira legislação abrangente do mundo sobre IA, estabelece regras rigorosas para o desenvolvimento e uso de sistemas de inteligência artificial.</p>
      
      <p>O acordo classifica sistemas de IA em diferentes níveis de risco, desde "risco inaceitável" - que serão proibidos - até "risco mínimo", com obrigações proporcionais. Sistemas de pontuação social, reconhecimento biométrico em massa e manipulação subliminar serão expressamente banidos.</p>
      
      <p>"Estamos escrevendo história hoje", declarou a presidente do Parlamento Europeu, Roberta Metsola. "A UE está liderando o mundo na construção de uma governança de IA que protege direitos fundamentais sem sufocar a inovação."</p>
      
      <h3>Regras por Categoria de Risco</h3>
      
      <p>Sistemas de IA de "alto risco", como aqueles usados em infraestrutura crítica, educação, recrutamento e aplicação da lei, deverão cumprir requisitos rigorosos de transparência, qualidade de dados e supervisão humana. Empresas que desenvolvem ou utilizam esses sistemas precisarão realizar avaliações de conformidade antes de colocá-los no mercado.</p>
      
      <p>Modelos de linguagem de grande porte, como o GPT-4 da OpenAI, serão classificados como sistemas de "impacto geral" e deverão atender a requisitos específicos de transparência, incluindo divulgação de dados de treinamento e medidas de mitigação de riscos sistêmicos.</p>
      
      <p>"A obrigação de transparência sobre dados de treinamento é um divisor de águas", comenta Pedro Santos. "Vai forçar as big techs a revelarem informações que até agora mantinham em segredo."</p>
      
      <h3>Multas e Conformidade</h3>
      
      <p>O AI Act prevê sanções pesadas para violações. Empresas que desenvolverem ou utilizarem sistemas de IA proibidos podem ser multadas em até 35 milhões de euros ou 7% do faturamento global anual, o valor que for maior. Não conformidade com outras obrigações pode resultar em multas de até 15 milhões ou 3% do faturamento.</p>
      
      <p>As regras devem entrar em vigor gradualmente ao longo de 2024 e 2025, com proibições de sistemas de risco inaceitável começando seis meses após a publicação da lei. Requisitos para sistemas de alto risco terão um período de transição de 24 meses.</p>
      
      <h3>Impacto Global</h3>
      
      <p>Analistas esperam que o AI Act da UE tenha efeito de "efeito Bruxelas", estabelecendo padrões que serão adotados globalmente. Assim como aconteceu com o GDPR de proteção de dados, empresas multinacionais tendem a aplicar as regras mais rigorosas em todos os mercados para simplificar conformidade.</p>
      
      <p>"O AI Act vai moldar o desenvolvimento de IA em escala global", afirma Maria Oliveira, que acompanhou as negociações em Bruxelas. "Empresas americanas e chinesas que quiserem operar na Europa terão que se adaptar."</p>
      
      <p>O Brasil observa de perto o modelo europeu enquanto desenvolve sua própria regulamentação. O projeto de lei brasileiro em tramitação no Congresso incorpora vários conceitos do AI Act, embora com abordagem considerada mais flexível.</p>
    `,
    category: 'tecnologia',
    author: 'Maria Oliveira',
    authorId: 'maria-oliveira',
    publishedAt: '2023-12-09T12:00:00Z',
    updatedAt: '2023-12-09T15:30:00Z',
    readingTime: 7,
    coverImage: '/images/news/ue-ia.webp',
    tags: ['UE', 'IA', 'Regulação', 'Tecnologia', 'Europa', 'Lei'],
    featured: true,
    breaking: false,
    views: 22100,
    likes: 1567,
    shares: 1234,
    comments: 678,
  },
  {
    id: '6',
    slug: 'brasil-crescimento-economico-2024',
    title: 'Economia brasileira surpreende com crescimento de 3,2% em 2023',
    titleEn: 'Brazilian economy surprises with 3.2% growth in 2023',
    excerpt: 'PIB supera expectativas do mercado impulsionado pela agropecuária e serviços. Projeções para 2024 indicam expansão mais moderada de 1,8%.',
    excerptEn: 'GDP exceeds market expectations driven by agriculture and services. Projections for 2024 indicate more moderate expansion of 1.8%.',
    content: `
      <p>A economia brasileira encerrou 2023 com crescimento de 3,2% do PIB, superando as expectativas do mercado que projetavam expansão em torno de 2,8%. O resultado foi impulsionado principalmente pelo desempenho excepcional do setor agropecuário e pela resiliência dos serviços.</p>
      
      <p>Dados divulgados pelo IBGE mostram que a agropecuária cresceu 15,1% no ano, beneficiada por condições climáticas favoráveis e alta produtividade. A safra recorde de grãos, estimada em 318 milhões de toneladas, consolidou o Brasil como um dos principais players globais do agronegócio.</p>
      
      <p>"O desempenho da agricultura foi fundamental para o resultado positivo", afirma Ana Silva, economista-chefe de uma grande instituição financeira. "Mas não podemos ignorar a contribuição dos serviços, que representam mais de 70% do PIB e cresceram 2,4%."</p>
      
      <h3>Setores em Destaque</h3>
      
      <p>O setor de serviços, motor da economia brasileira, manteve trajetória de crescimento consistente ao longo do ano. Atividades de tecnologia da informação, logística e comércio eletrônico lideraram a expansão, refletindo a aceleração da transformação digital.</p>
      
      <p>A indústria, por outro lado, apresentou crescimento mais modesto de 1,2%, limitada pela alta dos juros e pela capacidade ociosa em alguns segmentos. A indústria de transformação teve desempenho heterogêneo, com destaque para bens de capital e química.</p>
      
      <p>O setor da construção civil surpreendeu positivamente com expansão de 3,8%, impulsionada pelo programa Casa Verde e Amarela e pela retomada de investimentos em infraestrutura.</p>
      
      <h3>Consumo e Investimentos</h3>
      
      <p>O consumo das famílias, principal componente da demanda interna, cresceu 2,9% no ano. A queda da inflação e a recuperação do mercado de trabalho, com taxa de desemprego em 7,6%, sustentaram o poder aquisitivo da população.</p>
      
      <p>Os investimentos, medidos pela Formação Bruta de Capital Fixo (FBCF), avançaram 4,5%, indicando retomada da confiança empresarial. A produção de máquinas e equipamentos cresceu 8,2%, sinalizando expectativas positivas para os próximos meses.</p>
      
      <h3>Projeções para 2024</h3>
      
      <p>Economistas projetam crescimento mais moderado para 2024, em torno de 1,8% a 2%, devido à base de comparação mais desafiadora e aos efeitos ainda presentes dos juros elevados. A trajetória de queda da Selic, iniciada pelo Banco Central, deve ganhar tração apenas no segundo semestre.</p>
      
      <p>"2023 foi um ano excepcional para a agropecuária, o que dificulta a comparação em 2024", explica Carlos Mendes. "Precisamos ver crescimento mais equilibrado entre os setores para sustentar a expansão."</p>
      
      <p>O mercado de trabalho deve continuar como ponto positivo, com projeções de criação de 1,8 milhão de vagas formais em 2024. A taxa de desemprego deve recuar para patamar próximo de 7%.</p>
    `,
    category: 'economia',
    author: 'Ana Silva',
    authorId: 'ana-silva',
    publishedAt: '2023-12-08T09:00:00Z',
    updatedAt: '2023-12-08T11:30:00Z',
    readingTime: 6,
    coverImage: '/images/news/brasil-economia.webp',
    tags: ['Brasil', 'PIB', 'Economia', 'Crescimento', 'Agro', 'IBGE'],
    featured: false,
    breaking: false,
    views: 18760,
    likes: 1234,
    shares: 987,
    comments: 456,
  },
  {
    id: '7',
    slug: 'russia-ucrania-guerra-2-anos',
    title: 'Guerra na Ucrânia completa dois anos sem perspectiva de fim',
    titleEn: 'War in Ukraine completes two years with no end in sight',
    excerpt: 'Conflito se tornou guerra de atrito com milhares de mortos. Apoio ocidental à Ucrânia enfrenta desafios políticos nos EUA e Europa.',
    excerptEn: 'Conflict became war of attrition with thousands dead. Western support for Ukraine faces political challenges in US and Europe.',
    content: `
      <p>Em 24 de fevereiro de 2022, as forças armadas russas cruzaram a fronteira ucraniana em múltiplas frentes, iniciando a maior invasão militar na Europa desde a Segunda Guerra Mundial. Dois anos depois, o conflito se transformou em uma guerra de atrito devastadora, com estimativas de centenas de milhares de mortos e milhões de deslocados.</p>
      
      <p>A contra-ofensiva ucraniana lançada em junho de 2023 não conseguiu alcançar os objetivos estratégicos de Kiev, resultando em ganhos territoriais modestos a um custo humano enorme. As linhas de frente permanecem praticamente congeladas desde outubro, com intensos combates concentrados em cidades do leste como Avdiivka e Bakhmut.</p>
      
      <p>"Estamos vendo uma guerra de trincheiras do século XXI", descreve Julia Costa, especialista em conflitos armados. "Drones, artilharia e defesas fortificadas criaram um impasse que nenhum dos lados conseguiu quebrar."</p>
      
      <h3>Cenário Militar</h3>
      
      <p>A Rússia mantém vantagem numérica significativa em tropas e munições, embora tenha sofrido perdas pesadas em equipamentos modernos. A Ucrânia, por sua vez, depende cada vez mais de suprimentos ocidentais para sustentar seu esforço de guerra.</p>
      
      <p>A utilização massiva de drones - tanto de reconhecimento quanto de ataque - transformou o campo de batalha. Ambos os lados empregam milhares de veículos aéreos não tripulados, tornando movimentações de tropas extremamente perigosas.</p>
      
      <p>O mar Negro tornou-se outro teatro de operações, com ataques ucranianos à frota russa usando embarcações não tripuladas. A Rússia respondeu com bombardeios aos portos ucranianos, afetando as exportações de grãos.</p>
      
      <h3>Desafios do Apoio Ocidental</h3>
      
      <p>O pacote de ajuda militar americano de US$ 60 bilhões permanece bloqueado no Congresso dos EUA por conta de disputas políticas internas republicanas. Sem o financiamento americano, a Ucrânia enfrenta escassez de munição de artilharia e sistemas de defesa aérea.</p>
      
      <p>Na Europa, a Hungria do primeiro-ministro Viktor Orbán bloqueou repetidamente pacotes de ajuda da União Europeia, exigindo concessões em outras áreas. A UE conseguiu aprovar ajuda de 50 bilhões de euros apenas após intensa negociação.</p>
      
      <p>"O apoio ocidental à Ucrânia está em seu momento mais frágil", avalia Julia Costa. "A fadiga de guerra e as divisões políticas ameaçam a coesão da aliança."</p>
      
      <h3>Custo Humano</h3>
      
      <p>As Nações Unidas estimam que mais de 10.000 civis tenham sido mortos no conflito, embora o número real possa ser significativamente maior. Quase 6 milhões de ucranianos fugiram para outros países europeus, enquanto outros 5 milhões estão deslocados internamente.</p>
      
      <p>As perdas militares são estado sigiloso para ambos os lados, mas estimativas de inteligência ocidental sugerem centenas de milhares de baixas combinadas. A média diária de baixas no final de 2023 era a mais alta desde o início da guerra.</p>
      
      <p>"O custo humano desta guerra é imensurável", afirma o alto comissário da ONU para Direitos Humanos. "Cada dia de combates significa mais mortes, mais destruição e mais sofrimento."</p>
    `,
    category: 'geopolitica',
    author: 'Julia Costa',
    authorId: 'julia-costa',
    publishedAt: '2023-12-07T08:00:00Z',
    updatedAt: '2023-12-07T10:15:00Z',
    readingTime: 8,
    coverImage: '/images/news/ucrania-guerra.webp',
    tags: ['Ucrânia', 'Rússia', 'Guerra', 'Europa', 'OTAN', 'Conflito'],
    featured: false,
    breaking: false,
    views: 24560,
    likes: 1876,
    shares: 1543,
    comments: 1234,
  },
  {
    id: '8',
    slug: 'bitcoin-etf-spot-aprovado-eua',
    title: 'SEC aprova ETFs de Bitcoin spot nos Estados Unidos',
    titleEn: 'SEC approves spot Bitcoin ETFs in the United States',
    excerpt: 'Comissão de Valores Mobiliários autoriza 11 fundos de Bitcoin à vista. Criptomoeda salta 7% com expectativa de entrada de bilhões em investimentos.',
    excerptEn: 'Securities Commission authorizes 11 spot Bitcoin funds. Cryptocurrency jumps 7% with expectation of billions in investment inflows.',
    content: `
      <p>A Comissão de Valores Mobiliários dos Estados Unidos (SEC) aprovou nesta quarta-feira a listagem de 11 ETFs (fundos negociados em bolsa) de Bitcoin spot, marcando um momento histórico para o mercado de criptomoedas. A decisão, amplamente antecipada pelo mercado, representa a primeira vez que investidores americanos terão acesso a produtos de Bitcoin à vista regulados.</p>
      
      <p>Entre os aprovados estão fundos de grandes gestoras como BlackRock, Fidelity, Franklin Templeton e ARK Invest. Os ETFs devem começar a ser negociados já nesta quinta-feira nas principais bolsas americanas.</p>
      
      <p>"Esta aprovação representa uma validação institucional sem precedentes para o Bitcoin", afirma Carlos Mendes, analista de criptomoedas. "Estamos falando de potencial entrada de dezenas de bilhões de dólares em novos investimentos."</p>
      
      <h3>Reação do Mercado</h3>
      
      <p>O Bitcoin reagiu positivamente à notícia, saltando mais de 7% e ultrapassando os US$ 47.000. A criptomoeda acumula valorização de mais de 170% em 2023, impulsionada por expectativas em torno dos ETFs.</p>
      
      <p>Ações de empresas relacionadas a criptomoedas também se valorizaram. A Coinbase, exchange que servirá de custodiante para vários dos ETFs aprovados, viu suas ações subirem 12% no after-market.</p>
      
      <p>Analistas projetam que os ETFs de Bitcoin spot possam atrair entre US$ 10 bilhões e US$ 50 bilhões em investimentos apenas no primeiro ano de operação. A comparação com o lançamento dos ETFs de ouro em 2004, que revolucionaram o acesso ao metal precioso, é frequente entre especialistas.</p>
      
      <h3>Posição da SEC</h3>
      
      <p>A aprovação marca uma mudança de postura da SEC, que havia rejeitado dezenas de pedidos similares nos últimos anos. A comissão, liderada por Gary Gensler, manteve uma postura crítica às criptomoedas, citando preocupações com manipulação de mercado e proteção ao investidor.</p>
      
      <p>Em comunicado, a SEC afirmou que a aprovação não deve ser interpretada como endosso ao Bitcoin. "Investidores devem permanecer cautelosos sobre os inúmeros riscos associados a produtos de criptomoedas", alertou a comissão.</p>
      
      <p>A decisão veio após uma corte federal determinar em agosto que a SEC havia agido de forma arbitrária ao rejeitar o pedido da Grayscale para converter seu fundo de Bitcoin em ETF spot.</p>
      
      <h3>Impacto no Brasil</h3>
      
      <p>O Brasil foi pioneiro na regulação de ETFs de criptomoedas, com o primeiro fundo de Bitcoin spot aprovado pela CVM em 2021. Atualmente, existem mais de 15 ETFs de cripto negociados na B3.</p>
      
      <p>"O Brasil mostrou liderança regulatória nesta área", afirma Pedro Santos, especialista em fintechs. "Agora, com a aprovação americana, esperamos ver maior liquidez e interesse institucional nos fundos brasileiros."</p>
      
      <p>A Hashdex, gestora brasileira, está entre as aprovadas pela SEC com seu ETF de Bitcoin, representando uma vitória para o ecossistema de cripto do país.</p>
    `,
    category: 'economia',
    author: 'Carlos Mendes',
    authorId: 'carlos-mendes',
    publishedAt: '2023-12-06T14:30:00Z',
    updatedAt: '2023-12-06T16:00:00Z',
    readingTime: 5,
    coverImage: '/images/news/bitcoin-etf.webp',
    tags: ['Bitcoin', 'ETF', 'Criptomoedas', 'SEC', 'EUA', 'Investimentos'],
    featured: true,
    breaking: true,
    views: 32100,
    likes: 2345,
    shares: 1876,
    comments: 987,
  },
  {
    id: '9',
    slug: 'metaverso-realidade-virtual-2024',
    title: 'Metaverso encontra nova vida com avanços em realidade mista',
    titleEn: 'Metaverse finds new life with advances in mixed reality',
    excerpt: 'Apple Vision Pro e Meta Quest 3 impulsionam adoção de headsets. Empresas exploram aplicações corporativas além do entretenimento.',
    excerptEn: 'Apple Vision Pro and Meta Quest 3 drive headset adoption. Companies explore corporate applications beyond entertainment.',
    content: `
      <p>Após um período de hype excessivo seguido por ceticismo generalizado, o metaverso está encontrando uma nova trajetória de crescimento impulsionada por avanços em hardware de realidade mista. O lançamento do Apple Vision Pro e as vendas robustas do Meta Quest 3 estão redefinindo as expectativas para o mercado de headsets imersivos.</p>
      
      <p>A Apple começou a entregar o Vision Pro em fevereiro, com unidades esgotadas nas primeiras semanas apesar do preço premium de US$ 3.499. O headset, posicionado como dispositivo de "computação espacial", recebeu elogios por sua qualidade de visualização e interface inovadora controlada por olhar e gestos.</p>
      
      <p>"O Vision Pro é o produto mais ambicioso da Apple desde o iPhone", afirma Pedro Santos, analista de tecnologia. "A questão é se ele conseguirá justificar seu preço e encontrar aplicações de massa."</p>
      
      <h3>Competição no Mercado</h3>
      
      <p>A Meta, por sua vez, vendeu mais de 20 milhões de unidades da linha Quest, com o Quest 3 representando um salto significativo em poder de processamento e recursos de realidade mista. O headset de US$ 499 oferece experiências de pass-through de alta qualidade que misturam elementos virtuais com o mundo real.</p>
      
      <p>Outros players como Sony, com seu PSVR2, e a chinesa ByteDance, com o Pico 4, também competem por espaço no mercado. Estimativas projetam que mais de 10 milhões de headsets serão vendidos globalmente em 2024.</p>
      
      <p>"Estamos vendo uma fragmentação do mercado", observa Pedro Santos. "Cada fabricante está buscando nichos diferentes - entretenimento, produtividade, fitness, educação."</p>
      
      <h3>Aplicações Corporativas</h3>
      
      <p>Enquanto o consumo de mídia e jogos continua sendo o principal caso de uso, empresas estão descobrindo aplicações práticas para realidade mista. Treinamento imersivo, design colaborativo em 3D, prototipagem virtual e visitas a instalações remotas são alguns dos casos de sucesso.</p>
      
      <p>A Boeing anunciou que usará headsets de realidade mista para treinar mecânicos de aeronaves, reduzindo o tempo de capacitação em 75%. A Siemens implementou salas virtuais de revisão de projetos que permitem engenheiros de diferentes continentes colaborarem em modelos 3D em tempo real.</p>
      
      <p>"O valor corporativo está se tornando mais claro", afirma Ana Silva, consultora de transformação digital. "Empresas estão vendo ROI mensurável em aplicações específicas, não no metaverso genérico prometido anteriormente."</p>
      
      <h3>Desafios Persistentes</h3>
      
      <p>Apesar dos avanços, desafios significativos permanecem. O conforto físico continua sendo uma barreira para uso prolongado, com a maioria dos headsets sendo pesados e causando fadiga. A "ciberdoença" - náusea causada pela discrepância entre movimento visual e vestibular - afeta ainda uma parcela dos usuários.</p>
      
      <p>O ecossistema de conteúdo também precisa amadurecer. Enquanto jogos e experiências de entretenimento são abundantes, aplicações produtivas de qualidade ainda são limitadas. A promessa de trabalho remoto imersivo ainda não se materializou em escala.</p>
      
      <p>"Estamos no equivalente ao iPhone 3G do metaverso", compara Pedro Santos. "O hardware está melhorando rapidamente, mas precisamos de mais tempo para que os desenvolvedores criem aplicações realmente transformadoras."</p>
    `,
    category: 'tecnologia',
    author: 'Pedro Santos',
    authorId: 'pedro-santos',
    publishedAt: '2023-12-05T11:00:00Z',
    updatedAt: '2023-12-05T13:45:00Z',
    readingTime: 6,
    coverImage: '/images/news/metaverso.webp',
    tags: ['Metaverso', 'Realidade Virtual', 'Apple', 'Meta', 'Tecnologia', 'VR'],
    featured: false,
    breaking: false,
    views: 15670,
    likes: 987,
    shares: 654,
    comments: 432,
  },
  {
    id: '10',
    slug: 'india-superpotencia-economica-2030',
    title: 'Índia caminha para se tornar terceira maior economia do mundo',
    titleEn: 'India on track to become third largest economy in the world',
    excerpt: 'Economia indiana deve ultrapassar Japão e Alemanha até 2030. Crescimento é impulsionado por manufatura, serviços e consumo interno.',
    excerptEn: 'Indian economy expected to surpass Japan and Germany by 2030. Growth driven by manufacturing, services and domestic consumption.',
    content: `
      <p>A Índia está em trajetória para se tornar a terceira maior economia do mundo até 2030, ultrapassando o Japão e a Alemanha, segundo projeções do Fundo Monetário Internacional e de instituições financeiras globais. O país de 1,4 bilhão de habitantes consolidou-se como o motor de crescimento mais dinâmico entre as grandes economias.</p>
      
      <p>O PIB indiano cresceu 7,2% em 2023, superando as expectativas e consolidando-se como a economia de crescimento mais rápido entre os membros do G20. Para 2024, o FMI projeta expansão de 6,5%, mantendo o país à frente de China (4,6%) e bem acima da média global.</p>
      
      <p>"A Índia está passando por uma transformação estrutural profunda", afirma Maria Oliveira, economista especializada em mercados emergentes. "Reformas econômicas, digitalização e investimentos em infraestrutura estão criando as bases para décadas de crescimento."</p>
      
      <h3>Setores em Expansão</h3>
      
      <p>O setor de serviços de tecnologia continua sendo a estrela da economia indiana, com empresas como TCS, Infosys e Wipro dominando o mercado global de outsourcing de TI. No entanto, a manufatura está ganhando tração com o programa "Make in India", que oferece incentivos fiscais para produção local.</p>
      
      <p>A Apple, por exemplo, agora produz cerca de 25% de seus iPhones na Índia, diversificando sua cadeia de suprimentos além da China. Outras multinacionais como Samsung, Foxconn e Dell também expandiram significativamente suas operações no país.</p>
      
      <p>O setor farmacêutico indiano, já conhecido como "farmácia do mundo" por sua produção de genéricos, está evoluindo para medicamentos de maior valor agregado e biotecnologia. Empresas como a Serum Institute são líderes globais na produção de vacinas.</p>
      
      <h3>Consumo e Demografia</h3>
      
      <p>A classe média indiana, estimada em mais de 400 milhões de pessoas, representa um mercado consumidor de enorme potencial. O consumo privado responde por cerca de 60% do PIB, tornando a economia menos dependente de exportações do que muitos países asiáticos.</p>
      
      <p>O dividendo demográfico da Índia - com mais de 65% da população com menos de 35 anos - oferece vantagem competitiva em mão de obra abundante e relativamente jovem. O governo tem investido em programas de capacitação para transformar esse potencial em produtividade real.</p>
      
      <p>"A Índia tem a população mais jovem entre as grandes economias", destaca Carlos Mendes. "Se conseguir educar e empregar essa massa de trabalhadores, o potencial de crescimento é imenso."</p>
      
      <h3>Desafios Estruturais</h3>
      
      <p>Apesar do otimismo, a Índia enfrenta desafios significativos. A burocracia excessiva, embora reduzida nas últimas décadas, continua dificultando os negócios. A infraestrutura, embora melhorando, ainda apresenta lacunas significativas em transporte e energia.</p>
      
      <p>A desigualdade econômica também é preocupante. Enquanto as metrópoles como Mumbai, Bangalore e Delhi prosperam, vastas áreas rurais permanecem em pobreza. Cerca de 230 milhões de indianos ainda vivem abaixo da linha de pobreza.</p>
      
      <p>Relações tensas com a China, seu principal rival regional, representam risco geopolítico. Confrontos na fronteira disputada de Ladakh e competição por influência no Oceano Índico criam incertezas.</p>
      
      <p>"A trajetória de crescimento da Índia é sólida, mas não está garantida", conclui Maria Oliveira. "O país precisa continuar as reformas e investir em educação e infraestrutura para realizar seu potencial."</p>
    `,
    category: 'economia',
    author: 'Maria Oliveira',
    authorId: 'maria-oliveira',
    publishedAt: '2023-12-04T09:30:00Z',
    updatedAt: '2023-12-04T12:00:00Z',
    readingTime: 7,
    coverImage: '/images/news/india-economia.webp',
    tags: ['Índia', 'Economia', 'Ásia', 'Crescimento', 'Mercados Emergentes', 'FMI'],
    featured: false,
    breaking: false,
    views: 14230,
    likes: 876,
    shares: 543,
    comments: 321,
  },
];

// ==================== SERVICE FUNCTIONS ====================

export function getAllArticles(): NewsArticle[] {
  return [...mockArticles].sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getArticleBySlug(slug: string): NewsArticle | undefined {
  return mockArticles.find(article => article.slug === slug);
}

export function getArticlesByCategory(category: string): NewsArticle[] {
  return mockArticles
    .filter(article => article.category === category)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getFeaturedArticles(limit = 3): NewsArticle[] {
  return mockArticles
    .filter(article => article.featured)
    .slice(0, limit);
}

export function getBreakingNews(): NewsArticle[] {
  return mockArticles.filter(article => article.breaking);
}

export function getLatestArticles(limit = 10): NewsArticle[] {
  return getAllArticles().slice(0, limit);
}

export function getRelatedArticles(currentSlug: string, category: string, limit = 4): NewsArticle[] {
  return mockArticles
    .filter(article => article.slug !== currentSlug && article.category === category)
    .slice(0, limit);
}

export function getTrendingArticles(limit = 5): NewsArticle[] {
  return [...mockArticles]
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export function searchArticles(query: string): NewsArticle[] {
  const lowerQuery = query.toLowerCase();
  return mockArticles.filter(article =>
    article.title.toLowerCase().includes(lowerQuery) ||
    article.excerpt.toLowerCase().includes(lowerQuery) ||
    article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
