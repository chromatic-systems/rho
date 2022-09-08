import Glicol from "glicol"
import { sin,seq,imp } from 'glicol'
const glicol = new Glicol({loadSamples: true})

// get the play element
const play = document.querySelector("#play")
// add a click listener to the play element
play.addEventListener("click", () => {
  glicol.play({
    "o": imp(1.0).sp('808bd')
  })
})