// Importação das dependências
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
var Gerencianet = require('gn-api-sdk-node');
var credentials = require('./credentials');
 
var options = {
  client_id: credentials.client_id,
	client_secret: credentials.client_secret,
	sandbox: true,
}

// Configuração do express
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Endpoint para registro de um pedido
app.post('/novopedido', (req, res) => {
  const pedido = req.body;
  console.log(pedido);
  const pedidos = JSON.parse(fs.readFileSync('pedidos.json'));
  const novoPedido = { ...pedido, id:pedidos.length + 1};
  pedidos.push(novoPedido);
  fs.writeFileSync('pedidos.json', JSON.stringify(pedidos));

  var body = returnPayload(pedido);

  //var body = returnItems(pedido);

  console.log('Novo pedido:' + JSON.stringify(body));

  var gerencianet = new Gerencianet(options); 
  
  gerencianet
  //.createCharge({}, body)
  .createOneStepCharge({}, body)
  .then((resposta) => {
        //console.log(resposta)
        res.status(200).json(resposta);
    })
    .catch((error) => {
        //console.log(error);
        res.status(400).json(error);
    }).finally();

  // Salvar os dados do pedido no banco de dados ou arquivo
  //res.status(201).json(novoPedido);
});

// Endpoint para listar todos os pedidos registrados
app.get('/pedidos', (req, res) => {
  // Buscar todos os pedidos no banco de dados ou arquivo
  const pedidos = JSON.parse(fs.readFileSync('pedidos.json'));
  res.status(200).json(pedidos);
});

// Endpoint para buscar um pedido pelo seu ID
app.get('/pedidos/:id', (req, res) => {
    const pedidos = JSON.parse(fs.readFileSync('pedidos.json'));
    const pedido = pedidos.find(pedido => pedido.id === parseInt(req.params.id));

    if(!pedido){
        res.status(404).json({mensagem: 'Pedido não encontrado.'});
    } else {
        // Buscar o pedido pelo ID no banco de dados ou arquivo
        res.status(200).json({ pedido: pedido });
    }
});

// Inicialização do servidor
app.listen(4000, () => {
  console.log('Servidor iniciado na porta 4000');
});


function returnPayload(request) {
  return body = {
    items: [
      {
        name: request.produto,
        value: parseInt(request.valor)*100,
        amount: 1
      }
    ],
    payment: {
      banking_billet: {
        customer: {
          name: "Manuel Arthur Rafael Novaes",
          cpf: "85422201027",
          email: "manuel_novaes@willianfernandes.com.br",
          phone_number: "92998714903",
          address: {
            street: "Rua Barreirinha",
            number: 407,
            neighborhood: "São José Operário",
            zipcode: "69085180",
            city: "Manaus",
            complement: "",
            state: "AM"
          }
        },
        expire_at: "2023-05-24",
        configurations: {
          fine: 200,
          interest: 33
        },
        message: "Pague pelo código de barras ou pelo QR Code"
      }
    }
  };
}


