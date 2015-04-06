Unbeatable Tic Tac Toe!
=======================

This game demonstrates the implementation of a small Flask application using server-side Python and client-side JavaScript.
The server implements the [Minimax algorithm](http://en.wikipedia.org/wiki/Minimax) to ensure that the human player will never win.

Click [here](http://hiptactoe.herokuapp.com/) to see the live application.


Architecture
---------------------
The APIs are implemented in Python using the [Flask](http://flask.pocoo.org/) microframework and Jinja2 templates.
The client-side code is written in JavaScript and calls the APIs defined by the Python code.


Directory Structure
-------------------
* **app/** - The application code
    * **app/static/** - JS and CSS files
        * **app/static/images/** - Images used in the client application
        * **app/static/third_party/** - external JS libraries (JQuery)
    * **app/templates/** - Jinja2 HTML templates

Future Work
-----------
There are always areas that can be iterated upon and improved.  Possibilities for future improvement include:

- **UI enhancements** - currently, the human player always goes first and is always an "X".  Future work can allow the human player to choose their symbol and decide whether or not they wish to take the first move.  Also, the premise of the algorithm means that the game isn't very fun.. future work can be to allow two human players, and increase the size and dimension of the board :)
- **Multi-Browser and mobile support** - some minimal browser testing was done in Chrome, Safari, and Firefox but there are definitely some differences that can be fixed between browsers later on.


Author
------
**Kelsey Tripp** (www.katripp.com)
