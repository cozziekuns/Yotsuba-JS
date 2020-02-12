//=============================================================================
// ** Game_Action
//=============================================================================

class Game_Action {

  constructor(action_type, actor, data) {
    this.action_type = action_type;
    this.actor = actor;
    this.data = data;
  }

}

//=============================================================================
// ** Game_Hand
//=============================================================================

class Game_Hand {

  constructor(actor) {
    this.actor = actor;
    this.tiles = [];
    this.calls = [];
  }

  refreshHaipai(tiles) {
    this.tiles = tiles;
    this.sortTiles();
  }

  getTileAtIndex(index) {
    if (index >= this.tiles.length) {
      return -1;
    }

    return this.tiles[index];
  }

  getDrawnTile() {
    if (this.tiles.length % 3 === 2) {
      return this.getTileAtIndex(this.tiles.length - 1);
    }

    return -1;
  }
  
  sortTiles() {
    this.tiles.sort((a, b) => a - b);
  }

  sortWithDrawnTile(drawnTile) {
    const index = this.tiles.indexOf(drawnTile);

    this.tiles.splice(index, 1);
    this.sortTiles();
    this.tiles.push(drawnTile);
  }

  drawTile(tile) {
    this.tiles.push(tile);
  }

  discardTile(tile) {
    const index = this.tiles.indexOf(tile);

    this.tiles.splice(index, 1);
    this.sortTiles();
  }

}

//=============================================================================
// ** Game_Round
//=============================================================================

class Game_Round {

  constructor(round, homba) {
    this.round = round;
    this.homba = homba;
    this.riibou = 0;
    this.dora = [-2, -2, -2, -2, -2];
    this.points = [];

    this.wall = [];
    this.riichiSteps = [0, 0, 0, 0];
    this.riichiIndex = [-1, -1, -1, -1];

    this.actions = [];
    this.currentAction = 0;
    this.tilesLeft = 70;

    this.initHandsAndDiscards();
  }

  initHandsAndDiscards() {
    this.hands = [];
    this.discards = [];
    
    for (let i = 0; i < 4; i++) {
      this.hands.push(new Game_Hand(i));
      this.discards.push([]);
    }
  }

  getActorWind(actor) {
    return (actor + this.round) % 4;
  }

  getLastDrawAction() {
    for (let i = this.actions.length - 1; i >= 0; i--) {
      if (this.actions[i].action_type == 'draw') {
        return this.actions[i];
      }
    }

    return null;
  }

  performCurrentAction() {
    if (this.currentAction === this.actions.length) {
      return;
    }

    const action = this.actions[this.currentAction];

    switch(action.action_type) {
      case 'draw':
        this.performDrawAction(action);
        break;
      case 'discard':
        this.performDiscardAction(action);
        break;
      case 'riichi_call':
        this.performRiichiCall(action);
        break;
      case 'riichi_success':
        this.performRiichiSuccess(action);
        break;
    }

    this.currentAction += 1;
  }

  rewindCurrentAction() {
    if (this.currentAction === 0) {
      return;
    }

    const action = this.actions[this.currentAction - 1];

    switch(action.action_type) {
      case 'draw':
        this.rewindDrawAction(action);
        break;
      case 'discard':
        this.rewindDiscardAction(action);
        break;
      case 'riichi_call':
        this.rewindRiichiCall(action);
        break;
      case 'riichi_success':
        this.rewindRiichiSuccess(action);
        break;
    }

    this.currentAction -= 1;
  }

  //--------------------------------------------------------------------------
  // * Perform Action
  //--------------------------------------------------------------------------

  performDrawAction(action) {
    this.wall.shift();
    this.hands[action.actor].drawTile(action.data.tile);

    this.tilesLeft -= 1;
  }

  performDiscardAction(action) {
    const tile = action.data.tile;

    this.hands[action.actor].discardTile(tile);
    this.discards[action.actor].push(tile);

    if (this.riichiSteps[action.actor] === 1) {
      this.riichiIndex[action.actor] = this.discards[action.actor].length - 1;
    }
  }

  performRiichiCall(action) {
    this.riichiSteps[action.actor] = 1;
  }

  performRiichiSuccess(action) {
    this.riichiSteps[action.actor] = 2;
    this.points[action.actor] -= 1000;
  }

  rewindDrawAction(action) {
    const tile = action.data.tile;

    this.wall.unshift(tile);
    this.hands[action.actor].discardTile(tile);

    this.tilesLeft += 1;
  }

  rewindDiscardAction(action) {
    this.discards[action.actor].pop();

    this.hands[action.actor].drawTile(action.data.tile);
    this.hands[action.actor].sortWithDrawnTile(action.data.drawnTile);
  }

  rewindRiichiCall(action) {
    this.riichiSteps[action.actor] = 0;
    this.riichiIndex[action.actor] = -1;
  }

  rewindRiichiSuccess(action) {
    this.riichiSteps[action.actor] = 1;
    this.points[action.actor] += 1000;
  }

}

//=============================================================================
// ** Game_Replay
//=============================================================================

class Game_Replay {
  
  constructor() {
    this.rounds = [];
    this.currentRound = 0;
  }

  getCurrentRound() {
    return this.rounds[this.currentRound];
  }

  getLastRound() {
    return this.rounds[this.rounds.length - 1];
  }

  addRound(round) {
    this.rounds.push(round);
  }

}