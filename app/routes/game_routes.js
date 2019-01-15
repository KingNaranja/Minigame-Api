const express = require('express')
const passport = require('passport')

const Game = require('../models/game')

const handle = require('../../lib/error_handler')
const customErrors = require('../../lib/custom_errors')

const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership

const requireToken = passport.authenticate('bearer', { session: false })

const router = express.Router()

router.get('/games', requireToken, (req, res) => {
  Game.find()
    .then(games => {
      return games.map(game => game.toObject())
    })
    .then(games => res.status(200).json({ games: games }))
    .catch(err => handle(err, res))
})

router.get('/games/:id', requireToken, (req, res) => {
  Game.findById(req.params.id)
    .then(handle404)
    .then(game => res.status(200).json({ game: game.toObject() }))
    .catch(err => handle(err, res))
})

router.post('/games', requireToken, (req, res) => {
  req.body.game.owner = req.user.id

  Game.create(req.body.game)
    .then(game => {
      res.status(201).json({ game: game.toObject() })
    })
    .catch(err => handle(err, res))
})

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
