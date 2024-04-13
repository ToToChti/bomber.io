# Bomber.io

*Note to the reader: This game is not finished, and many bugs are still remaining. Maybe they'll be fixed one day. Thanks for your comprehension*

## Description of the project

The project we developped is a simple bomberman.
The principle of this game is quite simple: being the last one alive in a bomby world!

You can [play online on this site](https://bomber-io.glitch.me/) (might require some loading time). We advice you for testing to open 2 windows, because it's a multiplayer game :) !

## Gameplay

Players can move across the 2D map, destroy walls to make new paths and get bonus to become stronger and kill other players. The goal is to explode the other players until they have no more life. Players can increase their capacities using bonus.

**Keys to play:**
- Move up: `z`, `↑`
- Move down: `s`, `↓`
- Move left: `q`, `←`
- Move right: `d`, `→`
- Place bomb: `Space bar`

**Maps are made of three types of block:**
- Dirt roads: *Enables player to move on theses blocks*
- Concrete walls: *Undestroyable*
- Brick walls: *Destroyable using bombs explosion*

⚠ Players can't go through bombs! They can use them to block ohter players.

**Player's beginning stuff**
- 1 bomb (exploding after 3 seconds in a cross shape)
- 1 block radius explosion
- No ability to break many walls in a single direction at once
- 3 lives

**Different types of bonus:**
- Increased range:
  - Bomb has one more block explosion range
- One more bomb:
  - Player can place one more bomb
- Powerful explosion:
  - The explosion can now go through each layer of walls without stopping.

## Website organisation

### Home page

- ***Bomber.io* information**: A box on the left containing information about the game, and how to play it (scroling might be needed to see the whole content).

- **Play menu**: The box on the right takes two main aspects :
  - Group choice: Users must enter their pseudo. They can choose whether they want to host a room, or join an existing room (by clicking on one of the room in the list).
  - In-room tab: Once they joined or created a room, users are redirected to the in-room tab. The room host can choose the map to play, choose to start a game (only works if 2 players are in) or leave the room. For guests users, they can only wait for host to start a game, or they can leave the room.

Once the party is finished, the host can restart the game or quit the game-without quiting the party.
On the other hand, the rest of the players can only leave the party.

### Game page
- **Game canvas**: The game tab, where players can play
- **End game screen**: The end game screen. Game host can choose to restart the game, or go back to group page. Guests can only wait, or choose to leave the group.


## Languages and tools used
- Node.js
  - `socket.io` module
  - `express` module
  - `path` module
  - `http` module

- JavaScript
- HTML
- CSS
