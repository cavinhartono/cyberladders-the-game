package com.player;

public class EthicalHacker extends Role {
    public EthicalHacker(String name) {
        super(name);
    }

    @Override
    public int applyDiceSkill(int diceValue) {
        return diceValue;
    }

    @Override
    public int applyBoardSkill(int oldPosition, int newPosition) {
        if (newPosition < oldPosition && !isSkillUsed) {
            isSkillUsed = true;
            System.out.println("si " + name + " mengheck ular bos! cuman mundur dikit.");
            return oldPosition - 2;
        }

        return newPosition;
    }
}
