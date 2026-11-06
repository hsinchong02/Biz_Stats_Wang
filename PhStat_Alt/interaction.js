(function(root){
'use strict';
function nextCell(key,r,c,rows,cols,shift=false){const delta={ArrowDown:[1,0],ArrowUp:[-1,0],ArrowLeft:[0,-1],ArrowRight:[0,1],Enter:[shift?-1:1,0],Tab:[0,shift?-1:1]}[key];return delta?{r:Math.max(0,Math.min(rows-1,r+delta[0])),c:Math.max(0,Math.min(cols-1,c+delta[1]))}:null;}
function selectionText(grid,q){WData.parseRange(WData.cellAddress(q.r1,q.c1)+':'+WData.cellAddress(q.r2,q.c2));const rows=[];for(let r=q.r1;r<=q.r2;r++){const row=[];for(let c=q.c1;c<=q.c2;c++){const v=grid.display(r,c);row.push(/[\t\r\n"]/.test(v)?'"'+v.replaceAll('"','""')+'"':v);}rows.push(row.join('\t'));}return rows.join('\n');}
function clearSelection(grid,q){WData.parseRange(WData.cellAddress(q.r1,q.c1)+':'+WData.cellAddress(q.r2,q.c2));const changes=[];for(let r=q.r1;r<=q.r2;r++)for(let c=q.c1;c<=q.c2;c++){const key=`${r},${c}`;if(grid.cells.has(key))changes.push({key,old:grid.cells.get(key),value:''});}if(changes.length)grid.commit(changes);}
function resultGroups(runs,currentId){const current=runs.find(r=>r.id===currentId)||runs[0]||null;return {current,history:runs.filter(r=>r!==current)};}
function dragCell(x,y,rect,scrollLeft,scrollTop,rows,cols){return {r:Math.max(0,Math.min(rows-1,Math.floor((y-rect.top+scrollTop-30)/30))),c:Math.max(0,Math.min(cols-1,Math.floor((x-rect.left+scrollLeft-46)/120)))};}
function rangeAssignments(q){const result={};for(const [column,key]of [[0,'range'],[1,'range2']])if(q.c1<=column&&q.c2>=column)result[key]=WData.cellAddress(q.r1,column)+':'+WData.cellAddress(q.r2,column);return result;}
function twoSampleRanges(q,target){const address=c=>WData.cellAddress(q.r1,c)+':'+WData.cellAddress(q.r2,c);if(q.c2===q.c1+1)return {range:address(q.c1),range2:address(q.c2)};if(q.c1===q.c2)return {[target|| (q.c1===1?'range2':'range')]:address(q.c1)};return {};}
function requiresGrid(id,o={}){return !(['sample-mean','normal','binomial','dice','size-mean','size-prop','format','clear-style'].includes(id)||o.mode==='summary'||(id==='sample'&&o.source==='integers')||(id==='simulate'&&o.population!=='discrete'));}
const api={twoSampleRanges,nextCell,selectionText,clearSelection,resultGroups,dragCell,rangeAssignments,requiresGrid};root.WInteraction=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
