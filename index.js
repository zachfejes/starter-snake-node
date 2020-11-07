const bodyParser = require('body-parser')
const express = require('express')

const PORT = process.env.PORT || 3000

const app = express()
app.use(bodyParser.json())

app.get('/', handleIndex)
app.post('/start', handleStart)
app.post('/move', handleMove)
app.post('/end', handleEnd)

app.listen(PORT, () => console.log(`Battlesnake Server listening at http://127.0.0.1:${PORT}`))


//Call Handlers

function handleIndex(request, response) {
  var battlesnakeInfo = {
    apiversion: '1',
    author: 'zachfejes',
    color: '#1b004d',
    head: 'default',
    tail: 'default'
  }
  response.status(200).json(battlesnakeInfo)
}

function handleStart(request, response) {
  var gameData = request.body

  console.log('START')
  response.status(200).send('ok')
}

function handleMove(request, response) {
  var gameData = request.body
  let { game, turn, board, you: mySnake } = gameData;

  let move = decideNextDirection(mySnake, board);


  // var move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]


  console.log('MOVE: ' + move)
  response.status(200).send({
    move: move
  })
}

function handleEnd(request, response) {
  var gameData = request.body

  console.log('END')
  response.status(200).send('ok')
}


//Helper Functions
function decideNextDirection(mySnake, board) {
  let headPosition = mySnake.body[0];

  //var possibleMoves = ['up', 'down', 'left', 'right']

  let prioritizedMoves = seekFood(mySnake, board, 1);
  let bufferZone = 1;

  //Attempt to keep away from edge unless no other choice
  if(isInBufferZone(headPosition, board, bufferZone)) {
    console.log("WARNING: WE ARE TOO CLOSE TO THE EDGE");
    bufferZone = 0;
  }
  else {
    bufferZone = 1;
  }

  for(let move of prioritizedMoves) {
    let newPosition = moveAsVector(headPosition, move);
    if(!isOffBoard(newPosition, board, bufferZone) && !isSelfCollide(newPosition, mySnake)) {
      return move;
    }
  }

  return 'up';
}

function seekFood(mySnake, board, bufferZone) {
  let nearestMorsel, nearestMorselStepDistance;

  for(let morsel of board.food) {
    let morselStepDistance = minimumStepDistance(mySnake.head, morsel);

    if(!isInBufferZone(morsel, board, bufferZone)) {
      if(!nearestMorsel || morselStepDistance < nearestMorselStepDistance) {
        nearestMorsel = morsel;
        nearestMorselStepDistance = morselStepDistance;
      }
    }
  }

  let prioritizedMoves = [];

  if(!nearestMorsel) {
    return ['up', 'down', 'left', 'right'];
  }

  if(mySnake.head.x < nearestMorsel.x) {
    prioritizedMoves.push('right');
    prioritizedMoves.push('left');
  }
  else {
    prioritizedMoves.push('left');
    prioritizedMoves.push('right');
  }

  if(mySnake.head.y < nearestMorsel.y) {
    prioritizedMoves.unshift('up');
    prioritizedMoves.push('down');
  }
  else {
    prioritizedMoves.unshift('down');
    prioritizedMoves.push('up');
  }

  return prioritizedMoves;
}


function moveAsVector(headPosition, move) {
  switch(move) {
    case 'up':
      return { x: headPosition.x, y: headPosition.y + 1 };
    case 'down':
      return { x: headPosition.x, y: headPosition.y - 1 };
    case 'left':
      return { x: headPosition.x - 1, y: headPosition.y };
    case 'right':
      return { x: headPosition.x + 1, y: headPosition.y };
    default:
      console.log("move given does not match one of the allowed moves");
      return { x: -1, y: -1 };
  }
}



//Vector Math Functions
function vectorEqual(A, B) {
  return A.x === B.x && A.y == B.y;
}

function vectorAdd(A, B) {
  return ({ x: A.x + B.x, y: A.y + B.y });
}

function minimumStepDistance(A, B) {
  let xDist = A.x > B.x ? A.x - B.x : B.x - A.x;
  let yDist = A.y > B.y ? A.y - B.y : B.y - A.y;

  return xDist + yDist;
}


//Analyze Position
function isOffBoard(A, board, buffer = 0) {
  if(A.x < 0 + buffer || A.x >= board.width - buffer || A.y < 0 + buffer || A.y >= board.height - buffer) {
    return true;
  }

  return false;
}

function isInBufferZone(A, board, buffer) {
  if((A.x >= 0 && A.x <= 0 + buffer) || 
    (A.x >= board.width - buffer && A.x < board.width) || 
    (A.y >= 0 && A.y <= 0 + buffer) ||
    (A.y >= board.height - buffer && A.y < board.height)) {
    return true;
  }

  return false;
}

function isSelfCollide(A, snake) {
  for(let i = 1; i < snake.body.length; i++) {
    if(vectorEqual(A, snake.body[i])) {
      return true;
    }
  }
  
  return false;
}
