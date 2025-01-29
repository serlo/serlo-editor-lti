import { type AppStateError } from './App'

interface ErrorProps {
  appState: AppStateError
}

export default function Error({ appState }: ErrorProps) {
  return (
    <div className="eaas:bg-white eaas:p-4">
      <div className="eaas:rounded-lg eaas:border-4 eaas:border-red-500 eaas:p-4">
        {appState.message}
      </div>
      {appState.imageURL ? (
        <img className="eaas:mt-8 eaas:max-w-[350px]" src={appState.imageURL} />
      ) : null}
    </div>
  )
}
