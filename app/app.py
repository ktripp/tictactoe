#!/usr/bin/env python

from flask import *
from urllib2 import urlopen, HTTPError
import json, uuid, time
from tictactoe import *

UID_KEY = "ttt_id"

class TTTManager(Flask):
    """
    Keeps track of and creates new games.
    """
    def __init__(self, *args, **kwargs):
        super(TTTManager, self).__init__(*args, **kwargs)
        self.sessions = {}

    def createGame(self, id):
        self.cleanUpGames()
        self.sessions[id] = { "game": TicTacToe(EX),
                              "lastAccess": time.time() }

    def getGame(self, id):
        if id not in self.sessions:
            return None
        else:
            self.sessions[id]["lastAccess"] = time.time()
            return self.sessions[id]["game"]

    def cleanUpGames(self):
        # remove any games that are more than an hour old
        for uid, game in self.sessions.iteritems():
            if time.time() - self.sessions[uid]["lastAccess"] > 3600:
                del self.sessions[uid]


app = TTTManager(__name__, static_folder='static')


""" API Functions """
class App():
    """
    Endpoints for the application.
    """
    @app.route('/')
    def index():
        """
        Renders the home page of the application.
        """
        # get the uid if there is one
        uid = request.cookies.get(UID_KEY, None)
        if not uid:
            uid = str(uuid.uuid4())
            # create a new game for this user's uid
            app.createGame(uid)
        if not app.getGame(uid):
            app.createGame(uid)

        # set the cookie to remember this user
        resp = make_response(render_template('index.html'))
        resp.set_cookie(UID_KEY, uid)
        return resp

    @app.route('/state')
    def getGameState():
        """
        Returns the current state of the TicTacToe game.
        """
        uid = request.cookies.get(UID_KEY, None)
        if not uid or not app.getGame(uid):
            return App.constructErrorResponse("No game is currently being played.", 400)
        else:
            resp = {"gameState": app.getGame(uid).getGameState()} 
        return jsonify(resp=resp)

    @app.route('/action/respond', methods=['PUT'])
    def respondToMove():
        """
        Gets a move to place on the board from a human player,
        responds to the move, and returns the game state.
        """
        uid = request.cookies.get(UID_KEY, None)
        if not uid:
            return App.constructErrorResponse("No game is currently being played.", 400)
        else:
            game = app.getGame(uid)
            # get the request values
            req = request.get_json()
            if "row" in req and "col" in req:
                row = int(req["row"])
                col = int(req["col"])
                
                # make the move
                game.move(row, col, EX)

            # get the computer's response
            loc = game.respondToMove()
            if loc is not None:
                row, col = loc
                resp = {"row": row,
                        "col": col,
                        "gameState": game.getGameState()}
            else:
                resp = {"gameState": game.getGameState()}

        # return a JSON response
        return jsonify(resp=resp)

    @app.route('/action/restart', methods=['PUT'])
    def restartGame():
        """
        Restarts the TicTacToe game.
        """
        uid = request.cookies.get(UID_KEY, None)
        if not uid:
            uid = str(uuid.uuid4())
        app.createGame(uid)
        return jsonify({'status': 'OK'})

    @app.errorhandler(400)
    @app.errorhandler(403)
    @app.errorhandler(404)
    @app.errorhandler(500)
    def handle_http_error(error):
        """
        Handles common errors by displaying a custom page.
        """
        if "description" not in error:
            return render_template('error.html', error=error, description=""), 500
        return render_template('error.html', error=error, description=error.get_description()), error.code

    @staticmethod
    def constructErrorResponse(errorMsg, errorCode):
        """
        Constructs an error response.
        """
        error = { "error": errorMsg,
                  "status": errorCode }
        return jsonify(resp=error)


""" The main application """
if __name__ == '__main__':
    app.debug = True
    app.run()
