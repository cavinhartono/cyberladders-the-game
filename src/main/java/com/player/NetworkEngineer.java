package com.player;

public class NetworkEngineer extends Role {
    public NetworkEngineer(String name) {
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
            System.out.println("si " + name + " bebas dari ular bos.");
            return oldPosition;
        }

        return newPosition;
    }
}
