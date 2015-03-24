"use strict";

var players = ["ex", "oh"];
var currentPlayer = 0;
var computer = 1;
var human = computer ? 0 : 1;

var TIE = "tie";

var initGame = function () {
    // add and remove appropriate classes
    $("#computer").hide();
    $("#start_over").hide();
     
    $("#human").addClass(players[human]);
    $("#computer").addClass(players[computer]);

    // enable clicking on squares
    $(".square").on("click", takeTurn);
}

var restartGame = function () {
    // restart the game   
    $.ajax({
        url: $SCRIPT_ROOT + '/action/restart',
        method: "PUT",
        dataType: "json",
        success: function (data) {
            initGame();

            // reset the messaging
            $("#human p").text("Your turn!");
            $("#computer p").text("Computer's turn!");

            // add and remove appropriate classes
            $(".square").each(function () {
                $(this).removeClass(players[0]);
                $(this).removeClass(players[1]);
                $(this).removeClass("win");
                $(this).removeClass("clicked");
            });

            // reset player information
            currentPlayer = 0;
            computer = 1;
            human = 0;

            // enable clicking on squares
            $(".square").on("click", takeTurn);
        }
    });
};

var togglePlayer = function () {
    currentPlayer = currentPlayer ? 0 : 1;
    $("#human").fadeToggle();
    $("#computer").fadeToggle();
};

var respond = function (squareId) {
    // disable clicking while computer responds
    $(".square").off("click");

    // get the location of the clicked square
    var loc = squareId.split("");
    var data = { "row": loc[0],
                 "col": loc[1]
                };
    // request a response
    $.ajax({
        url: $SCRIPT_ROOT + '/action/respond',
        method: "PUT",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function (data) {
            // get the computer's response square and mark it
            var resp = data.resp;
            var squareId = "#" + resp['row'] + resp['col'];
            $(squareId).addClass("clicked").addClass(players[currentPlayer]);
            // check the game state and re-enable clicking
            checkGameState(resp['gameState'], function () {
                $(".square").on("click", takeTurn);
            });
        }
    });
}

var endGame = function (humanMsg, computerMsg) {
    // disable clicking and show the ending messages
    $(".square").off("click");
    $("#human").fadeToggle();
    $("#human p").text(humanMsg);
    $("#human").show();
    $("#computer p").text(computerMsg);
    $("#computer").show();

    // reset the game if requested
    setTimeout(function () {
        var restart = $("#start_over");
        restart.show("slow");
        restart.click(function () {
            setTimeout(function () {
                restartGame();
            }, 750);
        });
    }, 2000);
}

var checkGameState = function (state, callbackIfNotOver) {
    // check for if game is over
    if (state['gameOver']) {
       // if winner highlight the winning squares
        if (state["winner"] != TIE) {
            $.each(state["winLine"], function (i) {
                setTimeout(function () {
                    var id = "#" + state["winLine"][i].join("");
                    $(id).addClass("win");
                }, i * 100);
            });
        }
        // display the ending messaging
        if (state['winner'] === players[computer]) {
            endGame("You lose!", "Computer wins!");
        } else if (state['winner'] === players[human]) {
            endGame("You win!", "Computer loses!");
        } else if (state['winner'] === TIE) {
            endGame("Tie!", "Tie!");
        }
    } else {
        // otherwise take another turn
        togglePlayer();
        callbackIfNotOver();
    }
}

var takeTurn = function () {
    // allow squares to be clicked if they haven't already been chosen
    if (!$(this).hasClass("clicked")) {
        // mark the square with the correct symbol
        $(this).addClass("clicked").addClass(players[currentPlayer])
        // switch to computer and respond to human
        togglePlayer();
        respond(this.id);
    }
}

var ticTacToe = function () {
    initGame();
};


/* set everthing up when page is ready */
$(document).ready(function () {
    ticTacToe();
});
