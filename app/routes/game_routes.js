const express = require('express')
const passport = require('passport')

const Game = require('../models/game')

const handle = require('../../lib/error_handler')
const customErrors = require('../../lib/custom_errors')

const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership

const requireToken = passport.authenticate('bearer', { session: false })

const router = express.Router()

// Index 
router.get('/games', requireToken, (req, res) => {
  Game.find()
    .then(games => {
      return games.map(game => game.toObject())
    })
    .then(games => res.status(200).json({ games: games }))
    .catch(err => handle(err, res))
})

// Show ALL Games of User
// Get all of my games 
// GET /games/user
router.get('/games/myGames', requireToken, (req, res) => {
  Game.find().populate('owner', 'nickname').sort('-createdAt')
    .then(games => {
      // console.log(games)
      const myGames = []
      games.forEach(game => {
        // checks to see if the game owner'id matches that of the requesting user
        // if so, adds it to the myPosts array.
        if (req.user._id.equals(game.owner._id)) {
          // console.log(`searcher is `, req.user._id)
          // console.log(`game owner is `, game.owner)
          // console.log(`I added this postto an array`, game)
          myGames.push(game)
        }
      })
      // `games` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one

      // returns the array, after changing all the games to objects (though it's not really needed).
      return myGames.map(game => game.toObject())
    })
    // respond with status 200 and JSON of the games
    .then(games => res.status(200).json({ games: games }))
    // if an error occurs, pass it to the handler
    .catch(err => handle(err, res))
})



// Show one Game 
router.get('/games/:id', requireToken, (req, res) => {
  Game.findById(req.params.id)
    .then(handle404)
    .then(game => res.status(200).json({ game: game.toObject() }))
    .catch(err => handle(err, res))
})

// Create one Game 
router.post('/games', requireToken, (req, res) => {
  req.body.game.owner = req.user.id

  Game.create(req.body.game)
    .then(game => {
      res.status(201).json({ game: game.toObject() })
    })
    .catch(err => handle(err, res))
})

// Update one Game 
router.patch('/games/:id', requireToken, (req, res) => {
  delete req.body.game.owner

  Game.findById(req.params.id)
    .then(handle404)
    .then(game => {
      requireOwnership(req, game)

      Object.keys(req.body.game).forEach(key => {
        if (req.body.game[key] === '') {
          delete req.body.game[key]
        }
      })

      return game.update(req.body.game)
    })
    .then(() => res.sendStatus(204))
    .catch(err => handle(err, res))
})

// Delete one Game 
router.delete('/games/:id', requireToken, (req, res) => {
  Game.findById(req.params.id)
    .then(handle404)
    .then(game => {
      requireOwnership(req, game)
      game.remove()
    })
    .then(() => res.sendStatus(204))
    .catch(err => handle(err, res))
})

module.exports = router
