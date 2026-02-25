package com.player;

import com.component.Dice;

public class Programmer extends Role {
    private Dice dice;

    public Programmer(String name, Dice dice) {
        super(name);
        this.dice = dice;
    }

    @Override
    public int applyDiceSkill(int diceValue) {
        if (diceValue == 1 && !isSkillUsed) {
            isSkillUsed = true;
            System.out.println("si " + name + " melempar dadu");
            return dice.roll();
        }

        return diceValue;
    }

    @Override
    public int applyBoardSkill(int oldPosition, int newPosition) {
        return newPosition;
    }
}
