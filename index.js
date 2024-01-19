const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const preguntas = [
  {
    pregunta: '¿Cuál es la capital de Francia?',
    respuestas: ['Berlín', 'Madrid', 'París', 'Londres'],
    respuestaCorrecta: 'París',
  },
  {
    pregunta: '¿Cuántos planetas hay en nuestro sistema solar?',
    respuestas: ['7', '8', '9', '10'],
    respuestaCorrecta: '8',
  },
  {
    pregunta: '¿Cuál es el animal terrestre más grande?',
    respuestas: ['Elefante', 'Ballena Azul', 'Jirafa', 'Rinoceronte'],
    respuestaCorrecta: 'Elefante',
  },
];

let preguntaActualIndex = 0;
let puntos = {};

function enviarMensajeAUsuario(cliente, tipo, contenido) {
  const mensaje = {
    tipo: tipo,
    contenido: contenido,
  };
  cliente.send(JSON.stringify(mensaje));
}

function enviarPregunta() {
  const preguntaActual = preguntas[preguntaActualIndex];
  const mensaje = {
    tipo: 'pregunta',
    pregunta: preguntaActual.pregunta,
    respuestas: preguntaActual.respuestas,
  };
  broadcast(mensaje);
}

function broadcast(mensaje) {
  wss.clients.forEach((cliente) => {
    cliente.send(JSON.stringify(mensaje));
  });
}

function pasarASiguientePregunta(respuestaUsuario, cliente) {
  const preguntaActual = preguntas[preguntaActualIndex];
  const puntajeActual = puntos;

  enviarMensajeAUsuario(cliente, 'mensaje', `Respuesta ${preguntaActual.respuestaCorrecta === respuestaUsuario ? 'correcta' : 'incorrecta'}`);
  
  enviarMensajeAUsuario(cliente, 'mensaje', `Puntos acumulados: esta en producción`);

  if (preguntaActual.respuestaCorrecta === respuestaUsuario) {
    preguntaActualIndex += 1;
    
    if (preguntaActualIndex < preguntas.length) {
      enviarPregunta();
    } else {
      const resultado = {
        tipo: 'resultado',
        puntos: puntos,
      };
      broadcast(resultado);

      const gameOverMensaje = {
        tipo: 'mensaje',
        contenido: 'GAME OVER',
      };
      broadcast(gameOverMensaje);

      reiniciarJuego();
    }
  }
}

function reiniciarJuego() {
  preguntaActualIndex = 0;
  puntos = {};
}

wss.on('connection', (cliente) => {
  console.log('Cliente conectado');

  puntos[cliente] = 0;

  enviarPregunta();

  cliente.on('message', (mensaje) => {
    const respuesta = JSON.parse(mensaje);

    const preguntaActual = preguntas[preguntaActualIndex];
    if (respuesta && respuesta.tipo === 'respuesta') {
      if (respuesta.respuesta === preguntaActual.respuestaCorrecta) {
        puntos[cliente] += 1;

        pasarASiguientePregunta(respuesta.respuesta, cliente);
      } else {
        enviarMensajeAUsuario(cliente, 'mensaje', `Respuesta incorrecta. La respuesta correcta es: ${preguntaActual.respuestaCorrecta}`);
      }
    }
  });

  cliente.on('close', () => {
    console.log('Cliente desconectado');
    delete puntos[cliente];
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en ${PORT}`);
});
