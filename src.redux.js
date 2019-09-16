import React from 'react'

const ReactContext = React.createContext()

function compose(...fns){
  if(fns.length===0) return args => args
  if(fns.length ===1)  return fns[0]
  return fns.reduce((a,b)=>(...args)=>a(b(...args)))
}

// 包装了store的dspatch方法
export function applyMiddleware(...middlewares) {
  return function(createStore) {
    return function(reducer, initialValue) {
      let { store, connect, Provider } = createStore(reducer, initialValue)
      let dispatch
      const middlewareAPI = {
        getState: () => store.getState(),
        dispatch: (...args) => dispatch(...args)
      }

      let chain = middlewares.map(middleware => middleware(middlewareAPI))
      dispatch = compose(...chain)((...args) => store._dispatch(...args))
      store.dispatch = dispatch

      return {
        store,
        connect,
        Provider
      }
    }
  }
}

// 创建仓库
export function createStore(reducer, initialValue) {
  let store = {}
  // provider
  const Provider = props => {
    const [state, dispatch] = React.useReducer(reducer, initialValue)
    store.getState = () => state // getState用来获取状态
    store._dispatch = dispatch // 派发动作的函数
    
    return (
      <ReactContext.Provider value={state}>
      {
        React.cloneElement(props.children)
      }
      </ReactContext.Provider>
    )
  }
  // connect
  function connect(mapStateToProps, mapDispatchToProps) {
    return function(Component) {
      let state = initialValue
      let actions= {}
      
      return props => {
        if(store.getState) {
          state = mapStateToProps(store.getState())
        }
        actions = mapDispatchToProps(store.dispatch)

        return <Component {...props} {...state} {...actions} dispatch={store.dispatch} />
      }
    }
  }

  return {
    store,
    connect,
    Provider
  }
}
