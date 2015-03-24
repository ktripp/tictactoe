#!/usr/bin/env python

from flask import *
from urllib2 import urlopen, HTTPError
import json, decimal
from tictactoe import *

class TicTacToeApp(Flask):
    def __init__(self, *args, **kwargs):
        super(TicTacToeApp, self).__init__(*args, **kwargs)
        self.human = EX
        self.game = TicTacToe(self.human)

    def setHumanPlayer(self, symbol):
        self.human = symbol

    def restartGame(self):
        self.game = TicTacToe(self.human)


app = TicTacToeApp(__name__, static_folder='static')


""" API Functions """
class App():
    @app.route('/')
    def index():
        """
        Renders the home page of the application.
        """
        app.restartGame()
        return render_template('index.html')

    @app.route('/state')
    def getGameState():
        resp = {"gameState": app.game.getGameState()} 
        return jsonify(resp=resp)

    @app.route('/action/respond', methods=['PUT'])
    def respondToMove():
        req = request.get_json()
        row = int(req["row"])
        col = int(req["col"])
        
        # make the move
        app.game.move(row, col, app.human)

        # get the computer's response
        loc = app.game.respondToMove()
        if loc is not None:
            row, col = loc
            resp = {"row": row,
                    "col": col,
                    "gameState": app.game.getGameState()}
        else:
            resp = {"gameState": app.game.getGameState()}

        # return a JSON response
        return jsonify(resp=resp)

    @app.route('/action/restart', methods=['PUT'])
    def restartGame():
        app.restartGame()
        return jsonify({'status': 'OK'})

    @app.errorhandler(400)
    @app.errorhandler(403)
    @app.errorhandler(404)
    @app.errorhandler(500)
    def handle_http_error(error):
        """
        Handles common errors by displaying a custom page.
        """
        app.logger.error(error)
        if "description" not in error:
            return render_template('error.html', error=error, description=""), 500
        return render_template('error.html', error=error, description=error.get_description()), error.code


""" The main application """
if __name__ == '__main__':
    app.run()