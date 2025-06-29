import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Calculator from '@/components/apps/Calculator';

describe('Calculator Component (UI Test)', () => {
  it('should render the calculator with default display of 0', () => {
    render(<Calculator />);
    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('0');
  });

  it('should display numbers when clicked', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByText('7'));
    fireEvent.click(screen.getByText('8'));
    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('78');
  });

  it('should perform addition', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('='));
    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('15');
  });

  it('should perform subtraction', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByText('9'));
    fireEvent.click(screen.getByText('-'));
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('='));
    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('5');
  });

  it('should perform multiplication', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('×'));
    fireEvent.click(screen.getByText('5'));
    fireEvent.click(screen.getByText('='));
    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('15');
  });

  it('should perform division', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('0'));
    fireEvent.click(screen.getByText('÷'));
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('='));
    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('5');
  });

  it('should handle decimal points', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('.'));
    fireEvent.click(screen.getByText('5'));
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('.'));
    fireEvent.click(screen.getByText('5'));
    fireEvent.click(screen.getByText('='));
    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('4');
  });

  it('should clear the display with AC button', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('AC'));
    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('0');
  });

  it('should chain operations', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('0'));
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('5'));
    fireEvent.click(screen.getByText('-')); // Should calculate 10 + 5 = 15, then prepare for subtraction
    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('15');
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('='));
    expect(display).toHaveTextContent('12');
  });

  it('should handle division by zero', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByText('5'));
    fireEvent.click(screen.getByText('÷'));
    fireEvent.click(screen.getByText('0'));
    fireEvent.click(screen.getByText('='));
    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('Infinity');
  });

  it('should start a new calculation after a result is shown', () => {
    render(<Calculator />);
    // First calculation: 2 * 3 = 6
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('×'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('='));
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('6');

    // Start new calculation: 4 + 5 = 9
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('5'));
    fireEvent.click(screen.getByText('='));
    expect(screen.getByTestId('calculator-display')).toHaveTextContent('9');
  });
  
  it('should handle decimal input after an operator', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByText('5'));
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('.'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('='));
    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('5.2');
  });

  it('should allow changing the operator', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByText('5'));
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('-')); // Change operator
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('='));
    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('3'); // 5 - 2 = 3
  });

  it('should continue calculation from result after pressing equals then an operator', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('×'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('=')); // 6
    fireEvent.click(screen.getByText('+')); // use 6 as first operand
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('='));
    const display = screen.getByTestId('calculator-display');
    expect(display).toHaveTextContent('10');
  });
});
