import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAllCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const getCategoryTree = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();

    // Build category tree
    const categoryMap = new Map();
    const tree: any[] = [];

    // First pass: create all nodes
    categories.forEach(cat => {
      categoryMap.set(cat._id, {
        ...cat,
        children: []
      });
    });

    // Second pass: build tree structure
    categories.forEach(cat => {
      const node = categoryMap.get(cat._id);
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;
  },
});

export const getMainCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .filter((q) => 
        q.and(
          q.eq(q.field("level"), 0),
          q.eq(q.field("isActive"), true)
        )
      )
      .order("asc")
      .collect();
  },
});

export const getSubcategories = query({
  args: { parentId: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    parentId: v.optional(v.id("categories")),
    level: v.number(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("categories", {
      name: args.name,
      parentId: args.parentId,
      level: args.level,
      order: args.order,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const seedCategories = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing categories
    const existingCategories = await ctx.db.query("categories").collect();
    for (const cat of existingCategories) {
      await ctx.db.delete(cat._id);
    }

    const now = Date.now();

    // Main categories (level 0)
    const mainCategories = [
      { name: "Мода и аксессуары", order: 1 },
      { name: "Электроника", order: 2 },
      { name: "Дом и сад", order: 3 },
      { name: "Спорт и отдых", order: 4 },
      { name: "Транспорт", order: 5 },
      { name: "Хобби и развлечения", order: 6 },
      { name: "Детские товары", order: 7 },
      { name: "Красота и здоровье", order: 8 },
      { name: "Работа и бизнес", order: 9 },
      { name: "Недвижимость", order: 10 },
      { name: "Разное", order: 11 },
    ];

    const createdMainCategories: any = {};

    // Create main categories
    for (const cat of mainCategories) {
      const id = await ctx.db.insert("categories", {
        name: cat.name,
        level: 0,
        order: cat.order,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      createdMainCategories[cat.name] = id;
    }

    // Subcategories (level 1)
    const subcategories = [
      // Мода и аксессуары
      { name: "Женская одежда", parent: "Мода и аксессуары", order: 1 },
      { name: "Мужская одежда", parent: "Мода и аксессуары", order: 2 },
      { name: "Детская одежда", parent: "Мода и аксессуары", order: 3 },
      { name: "Обувь", parent: "Мода и аксессуары", order: 4 },
      { name: "Сумки и кошельки", parent: "Мода и аксессуары", order: 5 },
      { name: "Украшения", parent: "Мода и аксессуары", order: 6 },
      { name: "Часы", parent: "Мода и аксессуары", order: 7 },
      { name: "Очки", parent: "Мода и аксессуары", order: 8 },

      // Электроника
      { name: "Телефоны и планшеты", parent: "Электроника", order: 1 },
      { name: "Компьютеры и ноутбуки", parent: "Электроника", order: 2 },
      { name: "Игры и консоли", parent: "Электроника", order: 3 },
      { name: "Аудио и наушники", parent: "Электроника", order: 4 },
      { name: "ТВ и домашний кинотеатр", parent: "Электроника", order: 5 },
      { name: "Фото и видео", parent: "Электроника", order: 6 },
      { name: "Умный дом", parent: "Электроника", order: 7 },

      // Дом и сад
      { name: "Мебель", parent: "Дом и сад", order: 1 },
      { name: "Декор и интерьер", parent: "Дом и сад", order: 2 },
      { name: "Кухня и столовая", parent: "Дом и сад", order: 3 },
      { name: "Постельное белье и ванная", parent: "Дом и сад", order: 4 },
      { name: "Садоводство", parent: "Дом и сад", order: 5 },
      { name: "Инструменты", parent: "Дом и сад", order: 6 },
      { name: "Бытовая техника", parent: "Дом и сад", order: 7 },

      // Спорт и отдых
      { name: "Фитнес оборудование", parent: "Спорт и отдых", order: 1 },
      { name: "Спортивная одежда", parent: "Спорт и отдых", order: 2 },
      { name: "Велосипеды", parent: "Спорт и отдых", order: 3 },
      { name: "Зимние виды спорта", parent: "Спорт и отдых", order: 4 },
      { name: "Водные виды спорта", parent: "Спорт и отдых", order: 5 },
      { name: "Туризм и кемпинг", parent: "Спорт и отдых", order: 6 },

      // Транспорт
      { name: "Автомобили", parent: "Транспорт", order: 1 },
      { name: "Мотоциклы", parent: "Транспорт", order: 2 },
      { name: "Автозапчасти", parent: "Транспорт", order: 3 },
      { name: "Велосипеды и самокаты", parent: "Транспорт", order: 4 },

      // Хобби и развлечения
      { name: "Книги и журналы", parent: "Хобби и развлечения", order: 1 },
      { name: "Музыка и инструменты", parent: "Хобби и развлечения", order: 2 },
      { name: "Искусство и рукоделие", parent: "Хобби и развлечения", order: 3 },
      { name: "Коллекционирование", parent: "Хобби и развлечения", order: 4 },
      { name: "Настольные игры", parent: "Хобби и развлечения", order: 5 },

      // Детские товары
      { name: "Детская мебель", parent: "Детские товары", order: 1 },
      { name: "Игрушки", parent: "Детские товары", order: 2 },
      { name: "Детские книги", parent: "Детские товары", order: 3 },
      { name: "Коляски и автокресла", parent: "Детские товары", order: 4 },
      { name: "Детское питание", parent: "Детские товары", order: 5 },

      // Красота и здоровье
      { name: "Косметика", parent: "Красота и здоровье", order: 1 },
      { name: "Уход за волосами", parent: "Красота и здоровье", order: 2 },
      { name: "Парфюмерия", parent: "Красота и здоровье", order: 3 },
      { name: "Медицинское оборудование", parent: "Красота и здоровье", order: 4 },

      // Работа и бизнес
      { name: "Офисные принадлежности", parent: "Работа и бизнес", order: 1 },
      { name: "Профессиональное оборудование", parent: "Работа и бизнес", order: 2 },
      { name: "Промышленные инструменты", parent: "Работа и бизнес", order: 3 },

      // Недвижимость
      { name: "Квартиры", parent: "Недвижимость", order: 1 },
      { name: "Дома", parent: "Недвижимость", order: 2 },
      { name: "Коммерческая недвижимость", parent: "Недвижимость", order: 3 },
      { name: "Земельные участки", parent: "Недвижимость", order: 4 },

      // Разное
      { name: "Подарки и сувениры", parent: "Разное", order: 1 },
      { name: "Антиквариат", parent: "Разное", order: 2 },
      { name: "Прочее", parent: "Разное", order: 3 },
    ];

    const createdSubcategories: any = {};

    // Create subcategories
    for (const cat of subcategories) {
      const parentId = createdMainCategories[cat.parent];
      if (parentId) {
        const id = await ctx.db.insert("categories", {
          name: cat.name,
          parentId,
          level: 1,
          order: cat.order,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        createdSubcategories[cat.name] = id;
      }
    }

    // Sub-subcategories (level 2) - examples for key categories
    const subSubcategories = [
      // Женская одежда
      { name: "Платья", parent: "Женская одежда", order: 1 },
      { name: "Блузки и рубашки", parent: "Женская одежда", order: 2 },
      { name: "Юбки", parent: "Женская одежда", order: 3 },
      { name: "Брюки и джинсы", parent: "Женская одежда", order: 4 },
      { name: "Костюмы", parent: "Женская одежда", order: 5 },
      { name: "Верхняя одежда", parent: "Женская одежда", order: 6 },
      { name: "Трикотаж", parent: "Женская одежда", order: 7 },

      // Мужская одежда
      { name: "Рубашки", parent: "Мужская одежда", order: 1 },
      { name: "Футболки", parent: "Мужская одежда", order: 2 },
      { name: "Брюки", parent: "Мужская одежда", order: 3 },
      { name: "Джинсы", parent: "Мужская одежда", order: 4 },
      { name: "Костюмы", parent: "Мужская одежда", order: 5 },
      { name: "Верхняя одежда", parent: "Мужская одежда", order: 6 },

      // Обувь
      { name: "Женские туфли", parent: "Обувь", order: 1 },
      { name: "Женские сапоги", parent: "Обувь", order: 2 },
      { name: "Женские кроссовки", parent: "Обувь", order: 3 },
      { name: "Мужские ботинки", parent: "Обувь", order: 4 },
      { name: "Мужские кроссовки", parent: "Обувь", order: 5 },
      { name: "Детская обувь", parent: "Обувь", order: 6 },

      // Телефоны и планшеты
      { name: "iPhone", parent: "Телефоны и планшеты", order: 1 },
      { name: "Samsung", parent: "Телефоны и планшеты", order: 2 },
      { name: "Планшеты", parent: "Телефоны и планшеты", order: 3 },
      { name: "Аксессуары для телефонов", parent: "Телефоны и планшеты", order: 4 },

      // Компьютеры и ноутбуки
      { name: "Ноутбуки", parent: "Компьютеры и ноутбуки", order: 1 },
      { name: "Настольные ПК", parent: "Компьютеры и ноутбуки", order: 2 },
      { name: "Мониторы", parent: "Компьютеры и ноутбуки", order: 3 },
      { name: "Комплектующие", parent: "Компьютеры и ноутбуки", order: 4 },
    ];

    // Create sub-subcategories
    for (const cat of subSubcategories) {
      const parentId = createdSubcategories[cat.parent];
      if (parentId) {
        await ctx.db.insert("categories", {
          name: cat.name,
          parentId,
          level: 2,
          order: cat.order,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { message: "Categories seeded successfully" };
  },
}); 