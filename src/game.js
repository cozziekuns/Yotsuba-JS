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
    this.calledFrom = [];
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

  performCall(mentsu, target) {
    mentsu.forEach((tile) => {
      if (this.tiles.includes(tile)) {
        const index = this.tiles.indexOf(tile);

        this.tiles.splice(index, 1);
      }
    });

    this.calls.push(mentsu);
    this.calledFrom.push(target);

    this.sortTiles();
  }

  rewindLastCall() {
    // TODO: Special casing for ankan
    
    const mentsu = this.calls.pop();
    const target = this.calledFrom.pop();

    const callee_rel = (4 + target - this.actor) % 4;
    const tileIndex = (callee_rel - 1) % 2;

    const tile = mentsu.splice(tileIndex, 1);

    mentsu.forEach(tile => this.tiles.push(tile));

    return tile;
  }

}

//=============================================================================
// ** Game_Round
//=============================================================================

class Game_Round {

  constructor(replay, round, homba) {
    this.replay = replay;

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
      case 'call':
        this.performCallAction(action);
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
      case 'call':
        this.rewindCallAction(action);
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

  rewindToStart() {
    while (this.currentAction !== 0) {
      this.rewindCurrentAction();
    }
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

  performCallAction(action) {
    this.hands[action.actor].performCall(
      action.data.mentsu,
      action.data.target,
    );

    this.discards[action.data.target].pop();
    // TODO: do something with action.callType
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

  rewindCallAction(action) {
    const tile = this.hands[action.actor].rewindLastCall();

    this.discards[action.data.target].push(tile);
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
    this.currentRound = 2;
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

  gotoNextRound() {
    if (this.currentRound === this.rounds.length - 1) {
      return;
    }

    this.currentRound += 1;
  }

  gotoPreviousRound() {
    if (this.currentRound === 0) {
      return;
    }

    this.currentRound -= 1;
  }

}