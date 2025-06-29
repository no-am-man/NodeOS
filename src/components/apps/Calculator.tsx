"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(true);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
        setDisplay('.');
        setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clearDisplay = () => {
    setDisplay('0');
    setCurrentValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (currentValue === null) {
      setCurrentValue(inputValue);
    } else if (operator) {
      const result = calculate(currentValue, inputValue, operator);
      setCurrentValue(result);
      setDisplay(String(result));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);
    if (operator && currentValue !== null) {
      const result = calculate(currentValue, inputValue, operator);
      setDisplay(String(result));
      setCurrentValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const calculate = (firstOperand: number, secondOperand: number, op: string) => {
    switch (op) {
      case '+':
        return firstOperand + secondOperand;
      case '-':
        return firstOperand - secondOperand;
      case '*':
        return firstOperand * secondOperand;
      case '/':
        return firstOperand / secondOperand;
      default:
        return secondOperand;
    }
  };

  const renderButton = (label: string, onClick: () => void, className: string = '') => (
    <Button
      variant="outline"
      className={`h-16 text-xl ${className}`}
      onClick={onClick}
    >
      {label}
    </Button>
  );

  return (
    <div className="flex flex-col h-full bg-background p-2 gap-2">
      <div 
        data-testid="calculator-display"
        className="bg-muted text-right text-4xl font-mono p-4 rounded-md mb-2 overflow-x-auto"
      >
        {display}
      </div>
      <div className="grid grid-cols-4 gap-2 flex-grow">
        {renderButton('AC', clearDisplay, 'col-span-2 bg-destructive/80 hover:bg-destructive text-destructive-foreground')}
        {renderButton('÷', () => performOperation('/'), 'bg-primary/80 hover:bg-primary text-primary-foreground')}
        {renderButton('×', () => performOperation('*'), 'bg-primary/80 hover:bg-primary text-primary-foreground')}

        {renderButton('7', () => inputDigit('7'))}
        {renderButton('8', () => inputDigit('8'))}
        {renderButton('9', () => inputDigit('9'))}
        {renderButton('-', () => performOperation('-'), 'bg-primary/80 hover:bg-primary text-primary-foreground')}
        
        {renderButton('4', () => inputDigit('4'))}
        {renderButton('5', () => inputDigit('5'))}
        {renderButton('6', () => inputDigit('6'))}
        {renderButton('+', () => performOperation('+'), 'bg-primary/80 hover:bg-primary text-primary-foreground')}
        
        {renderButton('1', () => inputDigit('1'))}
        {renderButton('2', () => inputDigit('2'))}
        {renderButton('3', () => inputDigit('3'))}
        {renderButton('=', handleEquals, 'row-span-2 bg-primary hover:bg-primary/90 text-primary-foreground')}
        
        {renderButton('0', () => inputDigit('0'), 'col-span-2')}
        {renderButton('.', inputDecimal)}
      </div>
    </div>
  );
}