const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),babel=require('@babel/core');
// A small hook harness exercises form handlers without a simulator or new dependencies.
function form(name,props) {
 const state=[],deps=[],effects=[];let cursor=0,dirty=false;
 const React={createElement:(type,props,...children)=>({type,props:{...props,children}}),
 useState(initial){const i=cursor++;if(!(i in state))state[i]=initial;return [state[i],v=>{const next=typeof v==='function'?v(state[i]):v;if(next!==state[i])dirty=true;state[i]=next;}];},
 useEffect(fn,values){const i=cursor++;if(!deps[i]||values.some((v,n)=>v!==deps[i][n])){deps[i]=values;effects.push(fn);}}};
 const native={...Object.fromEntries(['View','Text','TextInput','TouchableOpacity','Modal','ScrollView','ActivityIndicator'].map(x=>[x,x])),StyleSheet:{create:x=>x},Dimensions:{get:()=>({height:900})},Alert:{alert:()=>{throw Error('Unexpected validation');}}};
 const source=fs.readFileSync(path.join(__dirname,`../src/components/${name}.js`),'utf8');
 const code=babel.transformSync(source,{babelrc:false,configFile:false,plugins:[require.resolve('@babel/plugin-transform-react-jsx'),require.resolve('@babel/plugin-transform-modules-commonjs')]}).code;
 const module={exports:{}};
 const requireMock=n=>{
  if(n==='react')return React;if(n==='react-native')return native;
  if(n==='./StationConditionPicker')return 'ConditionPicker';
  if(n.includes('apiService'))return {getBaitTypes:async()=>[],getChemicals:async()=>[]};
  if(n.includes('timeUtils'))return {formatTime:()=>''};
  if(n.includes('i18n'))return {t:k=>k};throw Error(n);
 };
 vm.runInNewContext(code,{module,exports:module.exports,require:requireMock,console,Date});
 return {render(){let tree,attempt=0;do{dirty=false;cursor=0;tree=module.exports.default(props);while(effects.length)effects.shift()();if(++attempt>10)throw Error('Render loop');}while(dirty);return tree;}};
}
function nodes(tree){if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(nodes);return [tree,...nodes(tree.props?.children)];}
function content(tree){if(typeof tree==='string')return tree;if(Array.isArray(tree))return tree.map(content).join('');return tree?.props?content(tree.props.children):'';}
for(const [name,type,fields] of [
 ['BaitStationForm','BS',['consumption','baitType']],['AtoxicStationForm','RM',['capture','rodentsCaptured','replacedSurface']],
 ['AtoxicStationForm','ST',['capture','rodentsCaptured','triggered']],['LTForm','LT',['mosquitoes','flies','others','replaceBulb']],
 ['PheromoneTrapForm','PT',['pheromoneType','insectsCaptured','replacedPheromone']]
]) for(const condition of ['Missing','Damaged']) test(`${type}: ${condition} locks measurements and saves null readings`,async()=>{
 let saved,closed=false;
 const runner=form(name,{stationId:'test',stationType:type,onClose:()=>{closed=true;},onStationLogged:r=>{saved=r;},existingStationData:{condition:'Functional',access:'Yes',consumption:'50%',baitType:'Test',capture:'Yes',rodentsCaptured:'4',flies:'10',others:['insect'],pheromoneType:'Test',insectsCaptured:'3'}});
 let tree=runner.render();nodes(tree).find(n=>n.type==='ConditionPicker').props.onChange(condition);tree=runner.render();
 const inputs=nodes(tree).filter(n=>n.type==='TextInput');for(const input of inputs)assert.equal(input.props.editable,false);
 const buttons=nodes(tree).filter(n=>n.type==='TouchableOpacity');
 const save=buttons.find(n=>/save/i.test(content(n)));assert.ok(save);assert.equal(!!save.props.disabled,false);
 await save.props.onPress();assert.equal(saved.condition,condition);assert.equal(closed,true);
 for(const field of fields)assert.equal(saved[field],null,field);
});
