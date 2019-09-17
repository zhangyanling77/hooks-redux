### hooks-redux
用react hooks的方式实现redux及中间件

### 安装最新版react （或支持hooks的版本即可）
```bash
yarn add react react-dom

```
### 实现hooks版redux
```javascript
import React from 'react'
const ReduxContext = React.createContext()
// 组合函数
function compose(...fns){
   if(fns.length ==0 ){
     return args=>args
   }
   if(fns.length ==1){
     return fns[0]
   }
   return fns.reduce((a,b)=>(...args)=>a(b(...args)))
}
// applyMiddleware 包装dispatch
export function applyMiddleware(...middlewares){
  return function(createStore){
    return function(reducer,initialState){
       let {store,connect,Provider}  = createStore(reducer,initialState)
       let dispatch
       const middlewareAPI= {
         getState:()=>store.getState(),
         dispatch:(...args)=>dispatch(...args)
       }
       let chain = middlewares.map(middleware=>middleware(middlewareAPI))
       dispatch = compose(...chain)((...args)=>store._dispatch(...args))
       store.dispatch  = dispatch
       return {store,connect,Provider}
    }
  }
}
// 创建仓库
export function createStore(reducer,initialState){
  let store = {}
  const Provider = props=>{
      const [state,dispatch] = React.useReducer(reducer,initialState)
      store.getState = ()=>state
      store._dispatch = dispatch
      return (
          <ReduxContext.Provider value={state}>
            {React.cloneElement(props.children)}
          </ReduxContext.Provider>
      )
  }
  // 连接react组件和redux仓库
  function connect(mapStateToProps,mapDispatchToProps){
      return function(Component){
          let state = initialState
          let actions = {}
          return props => {
              if(store.getState)
                state = mapStateToProps(store.getState())
              actions = mapDispatchToProps(store.dispatch) 
              return <Component {...props} {...state} {...actions} dispatch={store.dispatch}/>
          }
      }
  }
  return {store,connect,Provider}
}
```

使用自己的redux
```javascript
import React,{useReducer} from 'react'
import ReactDOM from 'react-dom'
import {createStore,applyMiddleware} from './redux'

let initialState = {number:0}
const INCREMENT = 'INCREMENT'
function reducer(state=initialState,action){
    switch (action.type) {
        case INCREMENT:
           return {number:state.number+1}
        default:
            return state
    }
}
//日志中间，在状态变化的前后打印日志
let logger = store => next => action => {
  console.log('%c prev state',`color:#A3A3A3,font-weight:bold`,store.getState())
  console.log('%c action',`color:#7FBEDF,font-weight:bold`,action)
  next(action)
  console.log('%c next state',`color:#9CD69B,font-weight:bold`,store.getState())
}
// 处理promise action
let promise = store => next => action => {
    if(action.then && typeof action.then === 'function'){
        return action.then(store.dispatch)
    }
    next(action)
}
// 处理action function，因为默认redux只处理普通对象
let thunk = store => next => action => {
    if(typeof action === 'function'){
        return action(store.dispatch,store.getState)
    }
    next(action)
}
let {store,connect,Provider} = applyMiddleware(thunk, promise, logger)(createStore)(reducer,initialState)
// 计数器组件
function Counter(props){
    return (
        <React.Fragment>
          <p>{props.number}</p>
          <button onClick={props.add}>+</button>
          <button onClick={props.thunkAdd}>thunkAdd+</button>
          <button onClick={props.promiseAdd}>promiseAdd+</button>
        </React.Fragment>
    )
}
//连接 组件和仓库
//把仓库中的状态映射为属性对象state状态树 返回state将会成为组件的属性对象props
let mapStateToProps = state=>state
//把dispatch方法映射为组件属性对象,一调用add方法，就会向仓库派发动作。
let mapDispatchToProps = dispatch=>(
    {
        add(){
            dispatch({type:INCREMENT})
        },
        thunkAdd(){
            dispatch(function(dispatch,getState){
                setTimeout(() => {
                    dispatch({type:INCREMENT})
                }, 1000)
            })
        },
        promiseAdd(){
            dispatch(new Promise(function(resolve,reject){
               setTimeout(() => {
                    resolve({type:INCREMENT})
                }, 1000)
            }))
        }
    }
)
let ConnectedCounter = connect(mapStateToProps,mapDispatchToProps)(Counter)

ReactDOM.render(
<Provider>
  <ConnectedCounter/>
</Provider>,document.getElementById('root'));

```
