import React, { createContext, useContext, useState } from 'react';

const AiFlowContext = createContext(null);

export function AiFlowProvider({ children }) {
  const [answers, setAnswers] = useState({});
  const [proposal, setProposal] = useState(null);

  function setAnswer(key, value) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  function reset() {
    setAnswers({});
    setProposal(null);
  }

  return (
    <AiFlowContext.Provider value={{ answers, proposal, setAnswer, setProposal, reset }}>
      {children}
    </AiFlowContext.Provider>
  );
}

export const useAiFlow = () => useContext(AiFlowContext);
