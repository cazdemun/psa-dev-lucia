'use client';

import React, { useState } from 'react';
import "@/styles/app.scss";

type Step = {
  explanation: string;
  command: string;
}

type ActionScript = {
  action: string;
  steps: Step[];
}

type Script = {
  actions: ActionScript[];
}

function trace<T>(message: T): T {
  console.log(message);
  return message;
}

// toolList
// memory

const dummyText = `
Por favor ayudame a instalar un servidor web en mi computadora.
`

export default function Home() {
  const [message, setMessage] = useState(dummyText);
  const [response, setResponse] = useState<Script>({ actions: [] });
  const [currentStep, setCurrentStep] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    if (response) {
      setResponse(data.response);
    }
    setCurrentStep(0);
  };

  // const handleNext = () => {
  //   if (response && currentStep < response.steps.length - 1) {
  //     setCurrentStep(currentStep + 1);
  //   }
  // };

  // const handlePrevious = () => {
  //   if (currentStep > 0) {
  //     setCurrentStep(currentStep - 1);
  //   }
  // };

  return (
    <div className="dl-grid">
      <div className="dl-col-4 dl-panel">
        <h1>Chat con ChatGPT</h1>
        <form onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje"
            style={{ minHeight: '10em', minWidth: '100%', resize: 'none' }}
          />
          <button type="submit">Enviar</button>
        </form>
      </div>
      <div className="dl-col-3 dl-panel">
        <pre>{JSON.stringify(response, null, 2)}</pre>
      </div>
      {/* <div className="dl-col-3 dl-panel">
        {response.steps.map((step, index) => (
          <div key={index}>
            <pre>{step.command}</pre>
          </div>
        ))}
      </div>
      <div className="dl-col-5 dl-panel">
        {response.steps.length === 0
          ? (<p>Esperando respuesta...</p>)
          : (
            <div>
              <h2>Respuesta:</h2>
              <div>
                <p>{response.steps[currentStep].explanation}</p>
                <pre>{response.steps[currentStep].command}</pre>
              </div>
              <button onClick={handlePrevious} disabled={currentStep === 0}>
                Anterior
              </button>
              <button onClick={handleNext} disabled={currentStep === response.steps.length - 1}>
                Siguiente
              </button>
            </div>
          )}
      </div> */}
    </div>
  );
}