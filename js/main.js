var cornerColors = {
    green: "#3BAD7C",
    red: "#be3d36",
    blue: "#205960",
    yellow: "#D3900B"
};
var cornerClickColors = {
    green: "#00dd63",
    red: "#f51509",
    blue: "#1ba2b4",
    yellow: "#ffc400"
};
/*
E - note(blue, lower right);
C♯ - note(yellow, lower left);
A - note(red, upper right).
E - note(green, upper left, an octave lower than blue);
*/
var cornerSounds = {
    green: 164.8,
    red: 440.0,
    blue: 329.6,
    yellow: 277.2,
    error: 523.3
};
$(document).ready(function() {
    let game = {
        isOn: false,
        isStarted: false,
        isStrict: false,
        sequence: [],
    };
    //Oscillator variables
    let context = new AudioContext();
    let o = context.createOscillator();
    let g = context.createGain();

    //All the interval's id are global in case the game is suddenly stoped by the user
    var playersTimeID, tileLightOnId, tileLightOffId, displayIntervalId;

    /*Change the game state Turn on/off*/
    $('.switch-btn input').on("click", function() {
        console.log("On Switch");
        game.isOn = $(this).is(":checked");
        if (game.isOn) {
            $('.display p').addClass("pulse");
            $('.display p').html("--");
            displayIntervalId = setInterval(function() {
                $('.display p').removeClass("pulse");
                clearInterval(displayIntervalId);
            }, 1000);
        } else {
            endGame("");
        }
    });

    /*Start  a new game*/
    $('.start').on('click', function() {
        console.log("On Start");
        if (!game.isOn) return; //Game turn off
        game.isStarted = !game.isStarted;
        $('.display p').removeClass("pulse");
        if (game.isStarted) {
            game.sequence = []; //clear sequence in case it's not the first game
            newTurn();
        } else {
            endGame("--");
        }
    });

    /*Change the game modality*/
    $('.strict').on('click', function() {
        console.log("On Strict");
        if (!game.isOn || game.isStarted) return; //Can't change the modality on the go
        game.isStrict = !game.isStrict;
        if (game.isStrict) $('.strict').addClass("on-strict"); //To ilustrate the state
        else $('.strict').removeClass("on-strict");
    });

    //Add a random new tile to the sequence
    function newTurn() {
        if (game.sequence.length === 20) { //Game finished
            $('.display p').addClass("pulse");
            $('.display p').html("WIN!!");
            displayIntervalId = setInterval(function() {
                $('.display p').removeClass("pulse");
                clearInterval(displayIntervalId);
                let wasStrict = game.isStrict;
                endGame();
                game.isStarted = true;
                game.isStrict = wasStrict;
                displayIntervalId = setInterval(function() {
                    newTurn(); //Start a new game 
                    clearInterval(displayIntervalId);
                }, 1000);
            }, 1000);
            return;
        }
        let newTile = Math.floor(Math.random() * 4); //Number 1-4
        switch (newTile) {
            case 0:
                newTile = "green";
                break;
            case 1:
                newTile = "red";
                break;
            case 2:
                newTile = "blue";
                break;
            case 3:
                newTile = "yellow";
                break;
        }
        game.sequence.push(newTile);
        simonsTurn();
    }

    //Show the whole sequence to the user
    function simonsTurn() {
        $('.corner').unbind(); //User cannot touch any tile during the demostration
        $('.display p').html(game.sequence.length);
        let index = 0; //To iterate through the sequence array
        tileLightOnId = setInterval(function() {
            console.log("Lights On:", index);
            //Turn on the tile's light and sound
            $('.' + game.sequence[index]).css('background', cornerClickColors[game.sequence[index]]);
            playSound(cornerSounds[game.sequence[index]], true);
            tileLightOffId = setInterval(function() {
                console.log("Lights Off", index);
                //After 800ms turn off the tile's light and sound
                $('.' + game.sequence[index]).css('background', cornerColors[game.sequence[index]]);
                playSound(cornerSounds[game.sequence[index]], false);
                clearInterval(tileLightOffId); //Stop this interval
                index++; //Pass to the next tile (in 400ms)
                if (index === game.sequence.length) {
                    //If we finished to display the sequence then is player's turn
                    clearInterval(tileLightOnId);
                    playersTurn();
                }
            }, 800);
        }, 1200);
    }

    //Add the listener to the tiles so the user can play the sequence
    function playersTurn() {
        console.log("Players Turn");

        //To iterate through the sequence
        let index = 0;
        playersTimeID = answerTime();
        /* When the user mousedown during simon's turn and then mouse up when is user's turn
         * the tile count for the sequence but do not display any color or sound because the tiles
         * where unbind during simon's turn. This could be tricky, so to avoid this, 
         * clickIn take a value in mousedown and if it is the same that the tile mouse up then
         * add it to the sequence and clean clickIn for the next tile
         */
        let clickIn = "";
        $('.corner').on('mousedown', function() {
            console.log("On Click");
            //Show tile's color change and play sound
            let tileColor = $(this).attr('class').split(" ")[1]; //Get which tile was pressed
            $(this).css('background', cornerClickColors[tileColor]);
            playSound(cornerSounds[tileColor], true);
            clickIn = tileColor;
        });
        $('.corner').on('mouseup', function() {
            console.log("On Mouse up");
            let tileColor = $(this).attr('class').split(" ")[1]; //Get which tile was pressed
            if (clickIn != tileColor) {
                clickIn = "";
                return;
            }
            clickIn = "";
            //Restore tile's normal color
            $(this).css('background', cornerColors[tileColor]);
            playSound(cornerSounds[tileColor], false);
            clearInterval(playersTimeID); //Stop players time
            if (tileColor === game.sequence[index]) { //Correct tile
                index++;
                if (index === game.sequence.length) //Sequence finished
                    newTurn();
                else
                    playersTimeID = answerTime();
            } else { //Wrong tile
                wrongTile();
            }
        });
    }
    //If the user run out of time
    function answerTime() {
        return setInterval(function() {
            wrongTile();
            clearInterval(playersTimeID);
        }, 3000);
    }

    //Handle wrong tile selected by the user
    function wrongTile() {
        //Wrong tile animation and sound
        playSound(cornerSounds["error"], true);
        $('.display p').addClass("pulse");
        $('.display p').html("!!");
        displayIntervalId = setInterval(function() {
            $('.display p').removeClass("pulse");
            clearInterval(displayIntervalId);
            if (game.isStrict) {
                endGame("--");
                game.isStarted = true;
                game.isStrict = true;
                newTurn(); //Start a new game 
            } else {
                simonsTurn();
            }
            playSound(cornerSounds["error"], false);
        }, 1000);
    }

    //Reestart game object and tiles' color. Stop all intervals that are possibly running
    function playSound(frec, play) {
        if (play) {
            o = context.createOscillator();
            g = context.createGain();
            o.connect(g);
            g.connect(context.destination);
            o.frequency.value = frec;
            o.type = "triangle";
            o.start(0);
        } else {
            g.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.1);
        }

    }

    function endGame(displayTxt) {
        playSound("", false);
        $('.diplay p').removeClass("pulse");
        $('.display p').html(displayTxt);
        game.isStarted = false;
        game.isStrict = false;
        game.sequence = [];
        clearInterval(playersTimeID);
        clearInterval(tileLightOnId);
        clearInterval(tileLightOffId);
        clearInterval(displayIntervalId);
        $('.green').css('background', cornerColors["green"]);
        $('.red').css('background', cornerColors["red"]);
        $('.blue').css('background', cornerColors["blue"]);
        $('.yellow').css('background', cornerColors["yellow"]);
    }
});