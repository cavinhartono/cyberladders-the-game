package com.player;

public abstract class Role {
    protected String name;
    protected int position;
    protected boolean isSkillUsed = false;

    public Role(String name) {
        this.name = name;
        this.position = 1;
    }

    public String getName() {
        return name;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public void move(int steps) {
        position += steps;
        if (position > 100)
            position = 100;
    }

    // Setelah melempar dadu gais
    public abstract int applyDiceSkill(int diceValue);

    // Mengecek Tangga/Ular
    public abstract int applyBoardSkill(int oldPosition, int newPosition);
}
