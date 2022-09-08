function scope(elementSelector, turnSelector) {
  // create a canvas element
  const canvas = document.getElementById(elementSelector);
  const ctx = canvas.getContext("2d");
  const turn = document.getElementById(turnSelector);
  // Make it visually fill the positioned parent
  // get the parent of the canvas element
  const container = canvas.parentNode;
  // set w and h to the width and height of the container
  const w = container.offsetWidth;
  const h = container.offsetHeight;
  // ...then set the internal size to match
  canvas.width = w
  canvas.height = h
  // convert polar to cartesian coordinates
  function polarToCartesian(r, theta) {
    return {
      x: r * Math.cos(theta),
      y: r * Math.sin(theta),
    };
  }
  
  // convert cartesian to polar coordinates
  function cartesianToPolar(x, y) {
    return {
      r: Math.sqrt(x * x + y * y),
      theta: Math.atan2(y, x),
    };
  }
  
  // given a float:0-1 return int:0-360
  function scale360(f) {
    return f * 360;
  }
  
  // given int:0-360 return radians:0-2pi
  function radians(degrees) {
    return (degrees * Math.PI) / 180;
  }
  
  function line(start, end, color) {
    return {
      start,
      end,
      color,
    };
  }
  
  // given float:0-1 return hsl:0-360
  function hsl(h_01, opacity) {
    return `hsla(${h_01 * 360}, 100%, 50%, ${opacity})`;
  }
  
  function generateLine(start_index, multiple, partitions, opacity) {
    const start_idx = start_index % partitions;
    const end_idx = (start_index * multiple) % partitions;
    const start_xy = getXYbyIndex(start_idx, partitions);
    const end_xy = getXYbyIndex(end_idx, partitions);
    const progress = start_index / partitions;
    const color = hsl(progress, opacity);
    return line(start_xy, end_xy, color);
  }
  
  function getXYbyIndex(index, partitions) {
    const radius = Math.min(w/2, h/2);
    const radians_per_partition = (2 * Math.PI) / partitions;
    const radians = radians_per_partition * index - Math.PI / 2;
    const xy = polarToCartesian(radius, radians);
    return xy;
  }
  
  // {start, end, color} => dra {
  function drawLine(line) {
    // add center to line.start and line.end
    const start = {
      x: line.start.x + center.x,
      y: line.start.y + center.y,
    };
    const end = {
      x: line.end.x + center.x,
      y: line.end.y + center.y,
    };
  
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = line.color;
    ctx.stroke();
    ctx.closePath();
  }
  
  // get the multiplier element
  const multiplier = document.getElementById("turn");
  
  let direction = 1;
  function drawLines(elapsed) {
    const turns_per_second = 0.1;
    const seconds_elapsed = elapsed / 1000;
    const current_turn = turns_per_second * seconds_elapsed + 2;
  
    const tail_turn = current_turn - Math.abs(Math.sin(seconds_elapsed / 5));
    const partitions = 800;
    const turns_per_partition = 1 / partitions;
    if (current_turn > partitions) {
      direction = -1;
    } else if (current_turn < partitions) {
      direction = 1;
    }
  
    // ========================================================
    // UPDATE UI
    // ========================================================
    turn.innerHTML = current_turn.toFixed(2);
    // tail.innerHTML = tail_turn.toFixed(2);
  
    for (let i = tail_turn; i <= current_turn; i += turns_per_partition) {
      if (i < 0) {
        continue;
      }
      const idx = Math.floor(i * partitions);
      const mult = Math.floor(i);
      const line = generateLine(idx, mult, partitions, 1);
      drawLine(line);
    }
  }
  
  // world center coordinates at half the canvas width and height
  const center = {
    x: canvas.width / 2,
    y: canvas.height / 2,
  };
  
  let prev_frame_number = -1;
  let start, previousTimeStamp;
  let done = false;
  
  const frames_per_second = 60;
  const ms_per_second = 1000;
  // start a request animation frame loop
  async function step(timestamp) {
    if (start === undefined) {
      start = timestamp;
    }
    const elapsed = timestamp - start; // in milliseconds
    const frame_number = Math.floor(elapsed / 60);
    if (frame_number > prev_frame_number) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      drawLines(elapsed);
      prev_frame_number = frame_number;
    }
    window.requestAnimationFrame(step);
  }
  
  window.requestAnimationFrame(step);
}

export default scope;