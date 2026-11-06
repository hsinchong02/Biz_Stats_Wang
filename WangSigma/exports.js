(function(root){
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
const safe=v=>v===undefined||v===null?'N/A':typeof v==='object'?JSON.stringify(v):v;
function settingRows(run){const fields=root.WRegistry?.procedures.flatMap(p=>p.fields)||[];return Object.entries(run.settings).filter(([k,v])=>v!==undefined&&!['title','excluded'].includes(k)).map(([k,v])=>{const f=fields.find(f=>f.key===k);return[f?.label||({rangeHeader:'X range includes a header',range2Header:'Probability range includes a header'}[k])||k,f?.type==='select'?(f.options.find(o=>o[0]===v)?.[1]||v):safe(v)];});}
function reportRows(run){const rows=[[run.title],['Run time',run.created],['Software version',run.version],['Source ranges',run.ranges||''],['Input revision',run.revision],['Method',run.method||''],['Interpretation',run.interpretation||'']];for(const n of run.notes||[])rows.push(['Note',n]);for(const t of run.tables){rows.push([], [t.title],t.columns,...t.rows.map(r=>r.map(safe)));}rows.push([],['Analysis settings'],['Setting','Value'],...settingRows(run));return rows;}
async function xlsx(runs,options={}){
 const book=new ExcelJS.Workbook();book.creator='WangSigma Business Statistics';book.created=new Date();const index=book.addWorksheet('Report index');index.addRow(['WangSigma Business Statistics']);index.addRow(['Analysis','Run time','Result sheet','Source sheet']);
 for(let i=0;i<runs.length;i++){const run=runs[i],sheet=book.addWorksheet('Result '+(i+1)),source=book.addWorksheet('Source '+(i+1));index.addRow([run.title,run.created,sheet.name,source.name]);for(const row of reportRows(run))sheet.addRow(row);source.addRow(['Input snapshot (text is stored as text, not formulas)']);source.addRow(run.sourceColumns||['Cell','Value']);for(const row of run.source||[])source.addRow(row.map(safe));if(run.invalid?.length){source.addRow([]);source.addRow(['Excluded cells','Reason / value']);run.invalid.forEach(r=>source.addRow(r));}if(run.blanks?.length){source.addRow([]);source.addRow(['Blank cells skipped']);run.blanks.forEach(x=>source.addRow([x]));}
 const maxCols=Math.min(20,Math.max(...reportRows(run).map(r=>r.length)));for(let c=1;c<=maxCols;c++)sheet.getColumn(c).width=c===1?37:23;source.columns.forEach((c,i)=>c.width=i%2===0?22:32);
 sheet.eachRow(row=>{row.eachCell(cell=>{cell.alignment={vertical:'top',wrapText:true};if(typeof cell.value==='number')cell.numFmt='0.###############';});if(row.cellCount===1){row.font={bold:true,color:{argb:'FF183B45'}};if(!options.neutral)row.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFE9F3F4'}};}});sheet.views=[{state:'frozen',ySplit:1}];const report=reportRows(run);for(const t of run.tables){if(!t.displayRows)continue;const heading=report.findIndex(row=>row.length===1&&row[0]===t.title);if(heading<0)continue;t.displayRows.forEach((row,i)=>row.forEach((value,j)=>{if(typeof t.rows[i]?.[j]==='number'&&typeof value==='string')sheet.getCell(heading+3+i,j+1).numFmt='"'+value.replaceAll('"','""')+'"';}));}
 let anchor=sheet.rowCount+3;for(const ch of run.charts||[]){const canvas=WCharts.renderChart(ch,run.chartStyle),base64=canvas.toDataURL('image/png'),imageId=book.addImage({base64,extension:'png'});sheet.addImage(imageId,{tl:{col:0,row:anchor},br:{col:4.8,row:anchor+20},editAs:'oneCell'});anchor+=23;}
 }
 index.columns=[{width:48},{width:30},{width:22},{width:22}];const buffer=await book.xlsx.writeBuffer();return new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
async function word(runs){
 const D=root.docx,children=[];const p=(text,heading)=>new D.Paragraph({text:String(text??''),heading,keepNext:!!heading,spacing:{after:120}});
 children.push(p('WangSigma Business Statistics',D.HeadingLevel.TITLE),p('This report records the selected analyses, their results, and the data and settings used to produce them. Results are saved snapshots.'));
 for(const run of runs){children.push(p(run.title,D.HeadingLevel.HEADING_1),p('Run time: '+run.created+' • Version '+run.version),p('Source: '+run.ranges));if(run.method)children.push(p('Method: '+run.method));if(run.interpretation)children.push(p(run.interpretation));(run.notes||[]).forEach(n=>children.push(p('Note: '+n)));
 for(const ch of run.charts||[]){const canvas=WCharts.renderChart(ch,run.chartStyle),png=canvas.toDataURL('image/png').split(',')[1],bytes=Uint8Array.from(atob(png),c=>c.charCodeAt(0));children.push(p(ch.title,D.HeadingLevel.HEADING_2),new D.Paragraph({children:[new D.ImageRun({data:bytes,type:'png',transformation:{width:650,height:303}})]}));}
 function addTable(t){children.push(p(t.title,D.HeadingLevel.HEADING_2));const count=t.columns.length;children.push(new D.Table({width:{size:100,type:D.WidthType.PERCENTAGE},rows:[t.columns,...(t.displayRows||t.rows)].map((row,i)=>new D.TableRow({tableHeader:i===0,children:row.map(v=>new D.TableCell({width:{size:100/count,type:D.WidthType.PERCENTAGE},shading:i===0?{fill:'E9F3F4'}:undefined,children:[new D.Paragraph({children:[new D.TextRun({text:typeof v==='number'?WCharts.fmt(v):String(safe(v)),bold:i===0,size:20})]})]}))}))}));}
 run.tables.forEach(addTable);addTable({title:'Analysis settings',columns:['Setting','Value'],rows:settingRows(run)});addTable({title:'Input snapshot',columns:run.sourceColumns||['Cell','Value'],rows:run.source||[]});if(run.invalid?.length)addTable({title:'Excluded cells',columns:['Cell','Reason / value'],rows:run.invalid});if(run.blanks?.length)children.push(p('Blank cells skipped: '+run.blanks.join(', ')));
 }
 const doc=new D.Document({creator:'WangSigma',title:'Business Statistics Results',styles:{default:{document:{run:{font:'Calibri',size:22}},title:{run:{font:'Calibri',color:'000000',size:40,bold:true}},heading1:{run:{color:'183B45',size:30,bold:true}},heading2:{run:{color:'183B45',size:24,bold:true}}}},sections:[{properties:{page:{size:{width:12240,height:15840},margin:{top:720,right:720,bottom:720,left:720}}},children}]});return await D.Packer.toBlob(doc);
}
async function readExcel(file){
 if(file.size>20000000)throw Error('Workbook imports are limited to 20 MB.');
 const bytes=await file.arrayBuffer();let book=new ExcelJS.Workbook();
 try{await book.xlsx.load(bytes);return book;}catch(original){
  // ExcelJS cannot parse prefixed SpreadsheetML element names in some valid workbooks.
  try{const zip=await JSZip.loadAsync(bytes);let changed=false;
   for(const [name,entry] of Object.entries(zip.files)){if(!name.endsWith('.xml')||entry.dir)continue;let xml=await entry.async('string');
    const match=xml.match(/xmlns:([A-Za-z_][\w.-]*)=(['"])http:\/\/schemas\.openxmlformats\.org\/spreadsheetml\/2006\/main\2/);
    if(!match)continue;const prefix=match[1].replace(/\./g,'[.]');
    xml=xml.replace(match[0],'xmlns='+match[2]+'http://schemas.openxmlformats.org/spreadsheetml/2006/main'+match[2]);
    xml=xml.replace(new RegExp('(<\\/?)'+prefix+':','g'),'$1');zip.file(name,xml);changed=true;
   }
   if(!changed)throw original;book=new ExcelJS.Workbook();await book.xlsx.load(await zip.generateAsync({type:'arraybuffer'}));return book;
  }catch(e){throw Error('Could not read this Excel workbook. '+(e.message||original.message));}
 }
}
function worksheetRows(sheet){const rows=[],issues=[],rowCount=sheet.rowCount,columnCount=sheet.columnCount;if(rowCount>110000||columnCount>10000)throw Error('The maximum is 110,000 rows and 10,000 columns.');if(rowCount*columnCount>250000)throw Error('This worksheet exceeds the 250,000-cell import limit. Copy a smaller range or use CSV.');sheet.eachRow({includeEmpty:true},(row,r)=>{const cells=[];for(let c=1;c<=columnCount;c++){const v=row.getCell(c).value;let result=v;if(v&&typeof v==='object'){if(v instanceof Date)result={kind:'date',value:v.toISOString()};else if('formula'in v||'sharedFormula'in v){if(v.result===undefined){issues.push(row.getCell(c).address);result={error:'#NO_CACHED_VALUE'};}else result=v.result;}else if(v.error)result={error:v.error};else if(v.richText)result=v.richText.map(x=>x.text).join('');else if(v.text)result=v.text;else result=String(v);}cells.push(result??'');}rows[r-1]=cells;});return {rows,issues};}
root.WExports={xlsx,word,download,readExcel,worksheetRows,reportRows};
})(globalThis);
