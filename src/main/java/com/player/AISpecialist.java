package com.player;

public class AISpecialist extends Role {
    public AISpecialist(String name) {
        super(name);
    }

    @Override
    public int applyDiceSkill(int diceValue) {
        if (!isSkillUsed) {
            isSkillUsed = true;
            System.out.println("si " + name + " menggunakan boost +3!");
            return diceValue + 3;
        }

        return diceValue;
    }

    @Override
    public int applyBoardSkill(int oldPosition, int newPosition) {
        return newPosition;
    }
}
