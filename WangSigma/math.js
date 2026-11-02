/* Local KaTeX typography for mathematical text; source strings remain unchanged. */
(function(root){
'use strict';
const tokenPattern=/\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$[^$\n]+\$|σ\s*=\s*√\[np\(1\s*[−-]\s*p\)\]|σ²\s*=\s*np\(1\s*[−-]\s*p\)|μ\s*=\s*np|Population mean\s*=\s*Σxp\(x\)|population variance\s*=\s*Σ\(x\s*−\s*mean\)²p\(x\)|population SD\s*=\s*√variance|Y\s*=\s*intercept\s*\+\s*slope\s*×\s*X|H[01]:\s*parameter\s*[=≠<>]+\s*[-+\d.eE]+|P\(|\bn\s*[−+-]\s*\d+\b|[μσΣαβχρθ](?:²)?/g;
function toLatex(text){
 if(/^\\\(|^\\\[/.test(text))return text.slice(2,-2);if(text.startsWith('$'))return text.slice(1,-1);
 if(/^\d+\/\d+$/.test(text)){const[n,d]=text.split('/');return `\\frac{${n}}{${d}}`;}
 if(/^σ\s*=\s*√/.test(text))return '\\sigma = \\sqrt{np(1-p)}';
 if(/^σ²\s*=/.test(text))return '\\sigma^2 = np(1-p)';
 if(/^μ\s*=/.test(text))return '\\mu = np';
 if(/^Population mean/.test(text))return '\\mu = \\sum_x x\\,p(x)';
 if(/^population variance/.test(text))return '\\sigma^2 = \\sum_x (x-\\mu)^2 p(x)';
 if(/^population SD/.test(text))return '\\sigma = \\sqrt{\\sigma^2}';
 if(/^Y\s*=/.test(text))return 'Y = \\text{intercept} + \\text{slope}\\,X';
 let result=text;if(/^P\(/.test(result)){result=result.slice(2,-1).replace(/\{/g,'\\{').replace(/\}/g,'\\}').replace(/\bin\b/g,'\\in');result='\\mathrm{P}\\left('+result+'\\right)';}
 result=result.replace(/X̄/g,'\\bar{X}').replace(/H([01]):\s*parameter/g,'H_{$1}: \\theta').replace(/<=/g,'\\le ').replace(/>=/g,'\\ge ').replace(/≠/g,'\\ne ').replace(/−/g,'-').replace(/²/g,'^2');
 const greek={'μ':'\\mu','σ':'\\sigma','Σ':'\\sum','α':'\\alpha','β':'\\beta','χ':'\\chi','ρ':'\\rho','θ':'\\theta'};
 return result.replace(/[μσΣαβχρθ]/g,c=>greek[c]).replace(/(\d+(?:\.\d+)?)e([+-]?\d+)/gi,'$1\\times 10^{$2}');
}
function parts(value){const text=String(value??'');if(/^\d+\/\d+$/.test(text))return[{text,latex:toLatex(text),math:true}];const result=[];const regex=new RegExp(tokenPattern.source,'g');let last=0,match;while((match=regex.exec(text))){let token=match[0];if(token==='P('){let depth=1,end=regex.lastIndex;while(end<text.length&&depth){if(text[end]==='(')depth++;else if(text[end]===')')depth--;end++;}if(depth)continue;token=text.slice(match.index,end);regex.lastIndex=end;}if(match.index>last)result.push({text:text.slice(last,match.index),math:false});result.push({text:token,latex:toLatex(token),math:true,display:token.startsWith('\\[')});last=regex.lastIndex;}if(last<text.length)result.push({text:text.slice(last),math:false});return result.length?result:[{text,math:false}];}
function setText(element,value){const content=parts(value);element.replaceChildren();for(const part of content){if(!part.math){element.append(document.createTextNode(part.text));continue;}const span=document.createElement('span');span.className='math-formula';span.dataset.mathSource=part.text;span.setAttribute('aria-label',part.text);try{if(!root.katex)throw Error('Math renderer unavailable');root.katex.render(part.latex,span,{throwOnError:true,trust:false,strict:'ignore',output:'htmlAndMathml',displayMode:!!part.display,maxExpand:100,maxSize:10});}catch{span.textContent=part.text;span.classList.add('math-fallback');}element.append(span);}}
root.WMath={parts,toLatex,setText};if(typeof module!=='undefined')module.exports=root.WMath;
})(globalThis);
