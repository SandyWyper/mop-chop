export function readyResultsArea(resultsDisplayArea) {
  // reset results output
  resultsDisplayArea.innerHTML = '';
  //insert header
  resultsDisplayArea.innerHTML += `
  <div class="title-bar-small">
    <a href='/mop-chop/'><h1>High-5!</h1></a>
  </div>
  `;
  // expand results area
  resultsDisplayArea.style['grid-row'] = '1 / 3';
}
