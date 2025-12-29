import os, sys
sys.path.insert(0, os.path.dirname(__file__))

import eventlet
# Exclude psycopg from monkey patching
eventlet.monkey_patch(psycopg=False)

from qsystem import application, socketio

if __name__ == "__main__":
    socketio.run(application, host="0.0.0.0", port=5000, debug=True)